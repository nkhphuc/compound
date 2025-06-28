# Multiple Files Implementation Plan for Spectral Fields

## Overview

Implement multiple file upload support for spectral fields in the compound form. Each spectral field can now store an array of files instead of a single file. Users can add more files when editing compounds, and delete individual files or all files at once.

## Database Changes

### 1. Update TypeScript Interfaces

**File: `frontend/types.ts` and `backend/src/types.ts`**

```typescript
// Update SpectralRecord to use arrays
export interface SpectralRecord {
  '1h'?: string[]; // Array of file URLs
  '13c'?: string[];
  dept?: string[];
  hsqc?: string[];
  hmbc?: string[];
  cosy?: string[];
  noesy?: string[];
  roesy?: string[];
  hrms?: string[];
  lrms?: string[];
  ir?: string[];
  uv_pho?: string[];
  cd?: string[];
}

// Update initial data
export const initialCompoundData = {
  // ... other fields
  pho: {
    '1h': [], '13c': [], dept: [], hsqc: [],
    hmbc: [], cosy: [], noesy: [],
    roesy: [], hrms: [], lrms: [],
    ir: [], uv_pho: [], cd: []
  },
  // ... other fields
};
```

### 2. Database Schema

No changes needed - JSONB field already supports arrays.

## Backend Changes

### 1. Multiple File Upload API

**File: `backend/src/controllers/uploadController.ts`**

```typescript
export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadedFiles = req.files!.files as any[];

    if (!Array.isArray(uploadedFiles)) {
      res.status(400).json({ success: false, error: 'Multiple files expected' });
      return;
    }

    await ensureBucketExists();
    const uploadPromises = uploadedFiles.map(async (file) => {
      const fileExtension = path.extname(file.name);
      const fileName = `${uuidv4()}${fileExtension}`;
      const putParams = {
        Bucket: S3_CONFIG.BUCKET,
        Key: fileName,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: 'public-read' as const,
      };
      await s3Client.send(new PutObjectCommand(putParams));
      return {
        url: `/${S3_CONFIG.BUCKET}/${fileName}`,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        mimetype: file.mimetype,
      };
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error uploading multiple files to S3/MinIO:', error);
    res.status(500).json({ success: false, error: 'Failed to upload files' });
  }
};
```

### 2. Update Validation Middleware

**File: `backend/src/middleware/validation.ts`**

```typescript
export const validateMultipleFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).json({
      success: false,
      error: 'No files uploaded'
    });
    return;
  }

  const uploadedFiles = req.files.files as any[];
  if (!Array.isArray(uploadedFiles)) {
    res.status(400).json({
      success: false,
      error: 'Multiple files expected'
    });
    return;
  }

  // File count validation (max 10 files per upload)
  if (uploadedFiles.length > 10) {
    res.status(400).json({
      success: false,
      error: 'Maximum 10 files allowed per upload'
    });
    return;
  }

  // Validate each file
  for (const file of uploadedFiles) {
    // File size validation (50MB limit per file)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      res.status(400).json({
        success: false,
        error: `File ${file.name} exceeds 50MB limit`
      });
      return;
    }

    // File type validation
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        error: `File type not allowed for ${file.name}. Please upload images or PDFs.`
      });
      return;
    }
  }

  next();
};
```

### 3. Update Routes

**File: `backend/src/routes/uploadRoutes.ts`**

```typescript
import { Router } from 'express';
import { uploadFile, uploadMultipleFiles } from '../controllers/uploadController';
import { validateFileUpload, validateMultipleFileUpload } from '../middleware/validation';

const router: Router = Router();

// POST /api/uploads - Upload a single file
router.post('/', validateFileUpload, (req, res, next) => { uploadFile(req, res).catch(next); });

// POST /api/uploads/multiple - Upload multiple files
router.post('/multiple', validateMultipleFileUpload, (req, res, next) => { uploadMultipleFiles(req, res).catch(next); });

export { router as uploadRoutes };
```

### 4. Update S3 Cleanup Logic

**File: `backend/src/services/compoundService.ts`**

```typescript
// Update file cleanup to handle arrays
async function cleanupSpectralFiles(oldPho: SpectralRecord, newPho: SpectralRecord) {
  for (const key of Object.keys(oldPho)) {
    const oldFiles = oldPho[key as keyof SpectralRecord];
    const newFiles = newPho[key as keyof SpectralRecord];

    if (Array.isArray(oldFiles)) {
      // Handle array of files
      for (const oldFile of oldFiles) {
        if (oldFile && oldFile.startsWith('http') &&
            (!Array.isArray(newFiles) || !newFiles.includes(oldFile))) {
          const s3Key = extractS3KeyFromUrl(oldFile);
          if (s3Key) {
            await deleteFileFromS3(s3Key);
          }
        }
      }
    } else if (typeof oldFiles === 'string') {
      // Handle legacy single file format
      if (oldFiles && oldFiles.startsWith('http') &&
          (!Array.isArray(newFiles) || !newFiles.includes(oldFiles))) {
        const s3Key = extractS3KeyFromUrl(oldFiles);
        if (s3Key) {
          await deleteFileFromS3(s3Key);
        }
      }
    }
  }
}
```

## Frontend Changes

### 1. Create Multiple File Input Component

**File: `frontend/components/ui/MultiFileInput.tsx`**

```typescript
import React, { useRef, useState } from 'react';

interface FileInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface MultiFileInputProps {
  id: string;
  label: string;
  selectedFiles: FileInfo[];
  onChange: (files: File[]) => void;
  onRemoveFile: (fileId: string) => void;
  onRemoveAll: () => void;
  accept?: string;
  maxFiles?: number;
  disabled?: boolean;
  wrapperClassName?: string;
}

export const MultiFileInput: React.FC<MultiFileInputProps> = ({
  id,
  label,
  selectedFiles,
  onChange,
  onRemoveFile,
  onRemoveAll,
  accept,
  maxFiles = 10,
  disabled = false,
  wrapperClassName = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleLabelClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onChange(files);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onChange(files);
    }
  };

  return (
    <div className={`space-y-2 ${wrapperClassName}`}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleLabelClick}
          disabled={disabled || selectedFiles.length >= maxFiles}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {label}
        </button>
        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={onRemoveAll}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
          >
            Remove All
          </button>
        )}
      </div>

      <input
        type="file"
        id={id}
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
        accept={accept}
        multiple
        disabled={disabled || selectedFiles.length >= maxFiles}
      />

      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${selectedFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleLabelClick}
      >
        <p className="text-sm text-gray-600">
          {selectedFiles.length >= maxFiles
            ? `Maximum ${maxFiles} files reached`
            : `Drag & drop files here or click to browse (max ${maxFiles})`
          }
        </p>
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length})</p>
          <div className="space-y-1">
            {selectedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2. Create File Preview Component

**File: `frontend/components/ui/SpectralFilesPreview.tsx`**

```typescript
import React from 'react';
import { getImageUrl } from '../../services/urlService';
import { TrashIcon } from '../icons/TrashIcon';

interface FileInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface SpectralFilesPreviewProps {
  files: FileInfo[];
  fieldLabel: string;
  onRemoveFile: (fileId: string) => void;
  onRemoveAll: () => void;
}

export const SpectralFilesPreview: React.FC<SpectralFilesPreviewProps> = ({
  files,
  fieldLabel,
  onRemoveFile,
  onRemoveAll,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-gray-700">{fieldLabel} Files ({files.length})</h5>
        <button
          type="button"
          onClick={onRemoveAll}
          className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
        >
          Remove All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map((file) => (
          <div key={file.id} className="border rounded-lg p-3 bg-white shadow-sm">
            {/* File Preview */}
            <div className="mb-2">
              {file.type.startsWith('image/') ? (
                <img
                  src={getImageUrl(file.url)}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-1">📄</div>
                    <div className="text-xs text-gray-500">PDF</div>
                  </div>
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <a
                  href={getImageUrl(file.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center"
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Update Compound Form

**File: `frontend/components/CompoundForm.tsx`**

#### 3.1 Update State Management

```typescript
// Update state types
const [spectralFiles, setSpectralFiles] = useState<Record<keyof SpectralRecord, FileInfo[]>>(
  SPECTRAL_FIELDS.reduce((acc, field) => {
    acc[field.key] = [];
    return acc;
  }, {} as Record<keyof SpectralRecord, FileInfo[]>)
);

const [spectralInputMethods, setSpectralInputMethods] = useState<Record<keyof SpectralRecord, SpectralInputMethod>>(
  SPECTRAL_FIELDS.reduce((acc, field) => {
    acc[field.key] = 'upload';
    return acc;
  }, {} as Record<keyof SpectralRecord, SpectralInputMethod>)
);
```

#### 3.2 Update File Upload Handler

```typescript
const handleSpectralMultipleFileChange = async (fieldKey: keyof SpectralRecord, files: File[]) => {
  try {
    // Validate files
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
    ];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setFormErrors(prev => ({
        ...prev,
        pho: {
          ...(prev.pho || {}),
          [fieldKey]: `Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}`
        }
      }));
      return;
    }

    // Upload files
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${API_BASE_URL}/uploads/multiple`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    // Create FileInfo objects
    const newFileInfos: FileInfo[] = data.data.map((fileData: any) => ({
      id: crypto.randomUUID(),
      name: fileData.originalName,
      url: fileData.url,
      size: fileData.size,
      type: fileData.mimetype,
    }));

    // Add to existing files
    setSpectralFiles(prev => ({
      ...prev,
      [fieldKey]: [...prev[fieldKey], ...newFileInfos]
    }));

    // Update form data with URLs
    setFormData(prev => ({
      ...prev,
      pho: {
        ...prev.pho,
        [fieldKey]: [...(prev.pho[fieldKey] || []), ...newFileInfos.map(f => f.url)]
      }
    }));

    // Clear errors
    setFormErrors(prev => {
      const newPhoErrors = { ...(prev.pho || {}) };
      delete newPhoErrors[fieldKey];
      return { ...prev, pho: newPhoErrors };
    });

  } catch (err) {
    setFormErrors(prev => ({
      ...prev,
      pho: {
        ...(prev.pho || {}),
        [fieldKey]: 'File upload failed'
      }
    }));
  }
};
```

#### 3.3 Update File Removal Handlers

```typescript
const removeSpectralFile = (fieldKey: keyof SpectralRecord, fileId: string) => {
  setSpectralFiles(prev => ({
    ...prev,
    [fieldKey]: prev[fieldKey].filter(file => file.id !== fileId)
  }));

  setFormData(prev => ({
    ...prev,
    pho: {
      ...prev.pho,
      [fieldKey]: prev.pho[fieldKey].filter((_, index) => {
        const fileToRemove = spectralFiles[fieldKey].find(f => f.id === fileId);
        return fileToRemove ? prev.pho[fieldKey][index] !== fileToRemove.url : true;
      })
    }
  }));
};

const removeAllSpectralFiles = (fieldKey: keyof SpectralRecord) => {
  setSpectralFiles(prev => ({
    ...prev,
    [fieldKey]: []
  }));

  setFormData(prev => ({
    ...prev,
    pho: {
      ...prev.pho,
      [fieldKey]: []
    }
  }));
};
```

#### 3.4 Update Form Initialization

```typescript
// In setupFormData function, update pho initialization
const sanitizedPho: SpectralRecord = {} as SpectralRecord;
const sanitizedSpectralFiles: Record<keyof SpectralRecord, FileInfo[]> = {} as Record<keyof SpectralRecord, FileInfo[]>;

SPECTRAL_FIELDS.forEach(field => {
  const key = field.key;
  const phoValue = parsedInitial.pho?.[key];

  if (Array.isArray(phoValue)) {
    sanitizedPho[key] = phoValue;
    sanitizedSpectralFiles[key] = phoValue.map(url => ({
      id: crypto.randomUUID(),
      name: url.split('/').pop() || 'Unknown file',
      url,
      size: 0, // We don't have size info for existing files
      type: url.includes('.pdf') ? 'application/pdf' : 'image/jpeg'
    }));
  } else if (typeof phoValue === 'string' && phoValue) {
    // Convert legacy single file to array
    sanitizedPho[key] = [phoValue];
    sanitizedSpectralFiles[key] = [{
      id: crypto.randomUUID(),
      name: phoValue.split('/').pop() || 'Unknown file',
      url: phoValue,
      size: 0,
      type: phoValue.includes('.pdf') ? 'application/pdf' : 'image/jpeg'
    }];
  } else {
    sanitizedPho[key] = [];
    sanitizedSpectralFiles[key] = [];
  }
});
```

#### 3.5 Update Form Rendering

```typescript
// Replace the existing spectral field rendering with:
{currentMethod === 'upload' && (
  <div className="space-y-4">
    <MultiFileInput
      id={`spectral-file-${fieldKey}`}
      label={t('compoundForm.browse')}
      selectedFiles={spectralFiles[fieldKey]}
      onChange={(files) => handleSpectralMultipleFileChange(fieldKey, files)}
      onRemoveFile={(fileId) => removeSpectralFile(fieldKey, fileId)}
      onRemoveAll={() => removeAllSpectralFiles(fieldKey)}
      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,image/*,application/pdf"
      maxFiles={10}
      wrapperClassName="mt-1"
    />

    <SpectralFilesPreview
      files={spectralFiles[fieldKey]}
      fieldLabel={fieldLabel}
      onRemoveFile={(fileId) => removeSpectralFile(fieldKey, fileId)}
      onRemoveAll={() => removeAllSpectralFiles(fieldKey)}
    />
  </div>
)}
```

### 4. Update Services

**File: `frontend/services/compoundService.ts`**

```typescript
// Add function to upload multiple files
export async function uploadMultipleFiles(files: File[]): Promise<FileInfo[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  try {
    const response = await fetch(`${API_BASE_URL}/uploads/multiple`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error('File upload failed: ' + (data?.error || response.status));
    }
    return data.data.map((fileData: any) => ({
      id: crypto.randomUUID(),
      name: fileData.originalName,
      url: fileData.url,
      size: fileData.size,
      type: fileData.mimetype,
    }));
  } catch (err) {
    console.error('[uploadMultipleFiles] Upload error:', err);
    throw err;
  }
}
```

## Excel Export Updates

**File: `frontend/services/xlsxExportService.ts`**

```typescript
// Update spectral data export to handle arrays
const exportMultipleSpectralFiles = async (spectralData: string[], fieldName: string, workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, startRow: number) => {
  if (!Array.isArray(spectralData) || spectralData.length === 0) {
    return startRow;
  }

  let currentRow = startRow;

  for (let i = 0; i < spectralData.length; i++) {
    const fileUrl = spectralData[i];
    const fileName = fileUrl.split('/').pop() || `File ${i + 1}`;

    // Add file label
    sheet.getCell(currentRow, 1).value = `${fieldName} - ${fileName}`;
    applyCellStyle(sheet.getCell(currentRow, 1), true);
    currentRow++;

    // Handle different file types
    if (fileUrl.startsWith('data:image')) {
      const imageBuffer = base64ToBuffer(fileUrl);
      if (imageBuffer) {
        const extension = getImageExtension(fileUrl);
        const imageId = workbook.addImage({ buffer: imageBuffer, extension });
        sheet.addImage(imageId, {
          tl: { col: 0.1, row: currentRow - 1 + 0.1 },
          ext: { width: 400, height: 300 }
        });
        currentRow += Math.ceil(300 / 20);
      }
    } else if (fileUrl.startsWith('http') || fileUrl.startsWith('/compound-uploads/')) {
      const fullImageUrl = getImageUrl(fileUrl);
      const imageBuffer = await urlToBuffer(fullImageUrl);
      if (imageBuffer) {
        const extension = getImageExtension(fileUrl);
        const imageId = workbook.addImage({ buffer: imageBuffer, extension });
        sheet.addImage(imageId, {
          tl: { col: 0.1, row: currentRow - 1 + 0.1 },
          ext: { width: 400, height: 300 }
        });
        currentRow += Math.ceil(300 / 20);
      } else {
        // Fallback to URL link
        const urlCell = sheet.getCell(currentRow, 2);
        urlCell.value = { text: `View ${fileName}`, hyperlink: fullImageUrl };
        urlCell.font = { color: { argb: 'FF0000FF' }, underline: true };
        currentRow++;
      }
    }

    currentRow++; // Add spacing between files
  }

  return currentRow;
};

// Update the main export function
// In the spectraImagesSheet section, replace the single file handling with:
for (const fieldConfig of SPECTRAL_FIELDS_CONFIG) {
  const spectrumData = compound.pho[fieldConfig.key];
  if (spectrumData && Array.isArray(spectrumData) && spectrumData.length > 0) {
    spectraRowNum = await exportMultipleSpectralFiles(
      spectrumData,
      t(fieldConfig.labelKey, fieldConfig.key),
      workbook,
      spectraImagesSheet,
      spectraRowNum
    );
  }
}
```

## Implementation Steps

1. **Database & Types**: Update TypeScript interfaces and initial data
2. **Backend**: Implement multiple file upload API and validation
3. **Frontend Components**: Create MultiFileInput and SpectralFilesPreview components
4. **Form Updates**: Update CompoundForm to handle multiple files
5. **Services**: Add multiple file upload service function
6. **Excel Export**: Update export to handle multiple files per spectral field
7. **Testing**: Test file upload, removal, and Excel export functionality

## Notes

- No backward compatibility needed - existing single files will be converted to arrays
- Maximum 10 files per spectral field
- Files can be added incrementally when editing compounds
- Individual file removal and bulk removal supported
- Drag & drop support for better UX
- Excel export shows all files for each spectral field
