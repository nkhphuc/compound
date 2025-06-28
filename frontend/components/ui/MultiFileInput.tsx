import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
            ? t('fileUpload.maxFilesReached', { maxFiles })
            : t('fileUpload.dragAndDrop', { maxFiles })
          }
        </p>
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
    </div>
  );
};
