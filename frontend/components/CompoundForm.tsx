import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { COMPOUND_STATUS_OPTIONS_KEYS, SPECTRAL_FIELDS, DEFAULT_LOAI_HC_OPTIONS, LOAI_HC_OTHER_STRING, DEFAULT_TRANG_THAI_OPTIONS, DEFAULT_MAU_OPTIONS, LOAI_HC_OTHER_STRING_KEY } from '../constants';
import { getUniqueLoaiHCValues, getUniqueTrangThaiValues, getUniqueMauValues, uploadFile, uploadMultipleFiles, deleteFile } from '../services/compoundService';
import { getImageUrl } from '../services/urlService';
import { CompoundData, initialCompoundData, UVSKLMData, SpectralRecord, NMRDataBlock, NMRSignalData, CompoundStatus, initialNMRDataBlock, initialNMRSignalData, NMRCondition, initialNMRCondition } from '../types';
import { SectionCard } from './SectionCard';
import { SingleNMRDataForm } from './SingleNMRDataForm';
import { TrashIcon } from './icons/TrashIcon';
import { Button } from './ui/Button';
import { CustomFileInput } from './ui/CustomFileInput';
import { Input } from './ui/Input';
import { MultiFileInput } from './ui/MultiFileInput';
import { Notification } from './ui/Notification';
import { Select } from './ui/Select';
import { SpectralFilesPreview } from './ui/SpectralFilesPreview';
import { Textarea } from './ui/Textarea';

interface CompoundFormProps {
  initialData?: CompoundData;
  onSave: (data: CompoundData) => Promise<boolean>;
  saveError?: string | null;
  isSaving?: boolean;
}

interface FileInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

type ImageInputMethod = 'upload' | 'url';
type SpectralInputMethod = 'upload' | 'url';

type FormErrors = {
  tenHC?: string;
  status?: string;
  loaiHC?: string;
  trangThai?: string;
  mau?: string;
  hinhCauTruc?: string;
  pho?: Partial<Record<keyof SpectralRecord, string>>;
};

// Define initial states for spectral records
const initialSpectralMethodsState: Record<keyof SpectralRecord, SpectralInputMethod> =
  SPECTRAL_FIELDS.reduce((acc, field) => {
    acc[field.key] = 'upload'; // Default method
    return acc;
  }, {} as Record<keyof SpectralRecord, SpectralInputMethod>);

const initialSpectralUrlsState: Record<keyof SpectralRecord, string[]> =
  SPECTRAL_FIELDS.reduce((acc, field) => {
    acc[field.key] = []; // Default empty URL array
    return acc;
  }, {} as Record<keyof SpectralRecord, string[]>);

export const CompoundForm: React.FC<CompoundFormProps> = ({ initialData, onSave, saveError: parentSaveError, isSaving }) => {
  const { t } = useTranslation();

  // Add state for selected NMR data block index
  const [selectedNmrIndex, setSelectedNmrIndex] = useState(0);

  // Initialize formData with a simple default
  const [formData, setFormData] = useState<CompoundData>(() => {
    const defaultPho = SPECTRAL_FIELDS.reduce((acc, field) => {
      acc[field.key] = [];
      return acc;
    }, {} as SpectralRecord);

    return {
      ...JSON.parse(JSON.stringify(initialCompoundData)),
      id: '',
      nmrData: [{ ...initialNMRDataBlock, id: '' }],
      pho: defaultPho
    };
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [currentSaveError, setCurrentSaveError] = useState<string | null>(null);
  const [validationNotification, setValidationNotification] = useState<{
    show: boolean;
    errors: string[];
  }>({ show: false, errors: [] });

  const [loaiHcDropdownOptions, setLoaiHcDropdownOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedLoaiHcInDropdown, setSelectedLoaiHcInDropdown] = useState<string>('');
  const [customLoaiHcInput, setCustomLoaiHcInput] = useState<string>('');
  const [showCustomLoaiHcInput, setShowCustomLoaiHcInput] = useState<boolean>(false);

  const [trangThaiDropdownOptions, setTrangThaiDropdownOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedTrangThaiInDropdown, setSelectedTrangThaiInDropdown] = useState<string>('');
  const [customTrangThaiInput, setCustomTrangThaiInput] = useState<string>('');
  const [showCustomTrangThaiInput, setShowCustomTrangThaiInput] = useState<boolean>(false);

  const [mauDropdownOptions, setMauDropdownOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedMauInDropdown, setSelectedMauInDropdown] = useState<string>('');
  const [customMauInput, setCustomMauInput] = useState<string>('');
  const [showCustomMauInput, setShowCustomMauInput] = useState<boolean>(false);

  const [imageInputMethod, setImageInputMethod] = useState<ImageInputMethod>('upload');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [structureImageFileName, setStructureImageFileName] = useState<string>('');

  const [spectralInputMethods, setSpectralInputMethods] = useState<Record<keyof SpectralRecord, SpectralInputMethod>>(initialSpectralMethodsState);
  const [spectralUrlInputs, setSpectralUrlInputs] = useState<Record<keyof SpectralRecord, string[]>>(initialSpectralUrlsState);

  // New state for multiple files
  const [spectralFiles, setSpectralFiles] = useState<Record<keyof SpectralRecord, FileInfo[]>>(
    SPECTRAL_FIELDS.reduce((acc, field) => {
      acc[field.key] = [];
      return acc;
    }, {} as Record<keyof SpectralRecord, FileInfo[]>)
  );

  const navigate = useNavigate();

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [uniqueExistingLoaiHc, uniqueExistingTrangThai, uniqueExistingMau] = await Promise.all([
          getUniqueLoaiHCValues(),
          getUniqueTrangThaiValues(),
          getUniqueMauValues()
        ]);

    const combinedLoaiHcOptions = new Set([...DEFAULT_LOAI_HC_OPTIONS, ...uniqueExistingLoaiHc]);
    const sortedLoaiHcOptions = Array.from(combinedLoaiHcOptions).sort();
    const loaiHcOpts = sortedLoaiHcOptions.map(opt => ({ value: opt, label: opt }));
        loaiHcOpts.push({ value: LOAI_HC_OTHER_STRING, label: t(LOAI_HC_OTHER_STRING_KEY) });
    setLoaiHcDropdownOptions(loaiHcOpts);

    const combinedTrangThaiOptions = new Set([...DEFAULT_TRANG_THAI_OPTIONS, ...uniqueExistingTrangThai]);
    const sortedTrangThaiOptions = Array.from(combinedTrangThaiOptions).sort();
    const trangThaiOpts = sortedTrangThaiOptions.map(opt => ({ value: opt, label: opt }));
    trangThaiOpts.push({ value: LOAI_HC_OTHER_STRING, label: t(LOAI_HC_OTHER_STRING_KEY) });
    setTrangThaiDropdownOptions(trangThaiOpts);

    const combinedMauOptions = new Set([...DEFAULT_MAU_OPTIONS, ...uniqueExistingMau]);
    const sortedMauOptions = Array.from(combinedMauOptions).sort();
    const mauOpts = sortedMauOptions.map(opt => ({ value: opt, label: opt }));
    mauOpts.push({ value: LOAI_HC_OTHER_STRING, label: t(LOAI_HC_OTHER_STRING_KEY) });
    setMauDropdownOptions(mauOpts);
      } catch (error) {
        console.error('Error loading metadata:', error);
      }
    };

    loadMetadata();
  }, [t]);

  useEffect(() => {
    const setupFormData = async () => {
      if (!initialData) return; // Only setup if we have initial data

      const parsedInitial = JSON.parse(JSON.stringify(initialData));

      const sanitizedPho: SpectralRecord = {} as SpectralRecord;

      SPECTRAL_FIELDS.forEach(field => {
        const key = field.key;
        const phoValue = parsedInitial.pho?.[key];

        if (Array.isArray(phoValue)) {
          sanitizedPho[key] = phoValue;
        } else if (typeof phoValue === 'string' && phoValue) {
          // Convert legacy single file to array
          sanitizedPho[key] = [phoValue];
        } else {
          sanitizedPho[key] = [];
        }
      });

      const dataToSet = {
        ...initialCompoundData,
        ...parsedInitial,
        status: parsedInitial.status || '',
        loaiHC: parsedInitial.loaiHC || '',
        trangThai: parsedInitial.trangThai || '',
        mau: parsedInitial.mau || '',
        sttHC: typeof parsedInitial.sttHC === 'number' ? parsedInitial.sttHC : parseInt(String(parsedInitial.sttHC), 10) || 0,
        cauHinhTuyetDoi: typeof parsedInitial.cauHinhTuyetDoi === 'boolean' ? parsedInitial.cauHinhTuyetDoi : false,
        pho: sanitizedPho,
        nmrData: parsedInitial.nmrData || [{ ...initialNMRDataBlock, id: crypto.randomUUID() }]
      };

      setFormData(dataToSet);

      // Initialize LoaiHC dropdown state
      const initialType = dataToSet.loaiHC || '';
      if (initialType === '') {
        setSelectedLoaiHcInDropdown(''); setCustomLoaiHcInput(''); setShowCustomLoaiHcInput(false);
      } else {
        const isStandardLoaiHc = loaiHcDropdownOptions.some(opt => opt.value === initialType && opt.value !== LOAI_HC_OTHER_STRING);
        if (isStandardLoaiHc) {
          setSelectedLoaiHcInDropdown(initialType); setCustomLoaiHcInput(''); setShowCustomLoaiHcInput(false);
        } else {
          setSelectedLoaiHcInDropdown(LOAI_HC_OTHER_STRING); setCustomLoaiHcInput(initialType); setShowCustomLoaiHcInput(true);
        }
      }

      const initialTrangThai = dataToSet.trangThai || '';
      if (initialTrangThai === '') {
        setSelectedTrangThaiInDropdown(''); setCustomTrangThaiInput(''); setShowCustomTrangThaiInput(false);
      } else {
        const isStandardTrangThai = trangThaiDropdownOptions.some(opt => opt.value === initialTrangThai && opt.value !== LOAI_HC_OTHER_STRING);
        if (isStandardTrangThai) {
          setSelectedTrangThaiInDropdown(initialTrangThai); setCustomTrangThaiInput(''); setShowCustomTrangThaiInput(false);
        } else {
          setSelectedTrangThaiInDropdown(LOAI_HC_OTHER_STRING); setCustomTrangThaiInput(initialTrangThai); setShowCustomTrangThaiInput(true);
        }
      }

      const initialMau = dataToSet.mau || '';
      if (initialMau === '') {
        setSelectedMauInDropdown(''); setCustomMauInput(''); setShowCustomMauInput(false);
      } else {
        const isStandardMau = mauDropdownOptions.some(opt => opt.value === initialMau && opt.value !== LOAI_HC_OTHER_STRING);
        if (isStandardMau) {
          setSelectedMauInDropdown(initialMau); setCustomMauInput(''); setShowCustomMauInput(false);
        } else {
          setSelectedMauInDropdown(LOAI_HC_OTHER_STRING); setCustomMauInput(initialMau); setShowCustomMauInput(true);
        }
      }

      const initialImageSrc = dataToSet.hinhCauTruc || '';
      if (initialImageSrc.startsWith('data:image')) {
        setImageInputMethod('upload');
        setImageUrlInput('');
        setStructureImageFileName(t('compoundForm.uploadedFilePlaceholder'));
      } else if (initialImageSrc.startsWith('http')) {
        setImageInputMethod('url');
        setImageUrlInput(initialImageSrc);
        setStructureImageFileName('');
      } else {
        setImageInputMethod('upload');
        setImageUrlInput('');
        setStructureImageFileName('');
      }

      // Initialize spectral input methods based on existing data
      const iSpectralInputMethods: Record<keyof SpectralRecord, SpectralInputMethod> = { ...initialSpectralMethodsState };
      const iSpectralUrlInputs: Record<keyof SpectralRecord, string[]> = { ...initialSpectralUrlsState };

      SPECTRAL_FIELDS.forEach(field => {
        const key = field.key;
        const phoValue = dataToSet.pho[key];

        if (Array.isArray(phoValue) && phoValue.length > 0) {
          const firstFile = phoValue[0];
          if (firstFile.startsWith('data:')) {
            iSpectralInputMethods[key] = 'upload';
            iSpectralUrlInputs[key] = [];
          } else if (firstFile.startsWith('http')) {
            iSpectralInputMethods[key] = 'url';
            iSpectralUrlInputs[key] = [firstFile];
          } else {
            iSpectralInputMethods[key] = 'upload';
            iSpectralUrlInputs[key] = [];
          }
        }
      });
      setSpectralInputMethods(iSpectralInputMethods);
      setSpectralUrlInputs(iSpectralUrlInputs);

      setFormErrors({});
      setCurrentSaveError(null);
    };

    setupFormData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, t, loaiHcDropdownOptions.length, trangThaiDropdownOptions.length, mauDropdownOptions.length]);

  // Initialize spectral files state based on formData
  useEffect(() => {
    if (initialData && formData.pho) {
      const sanitizedSpectralFiles: Record<keyof SpectralRecord, FileInfo[]> = {} as Record<keyof SpectralRecord, FileInfo[]>;

      SPECTRAL_FIELDS.forEach(field => {
        const key = field.key;
        const phoValue = formData.pho[key];

        if (Array.isArray(phoValue) && phoValue.length > 0) {
          sanitizedSpectralFiles[key] = phoValue.map(url => ({
            id: crypto.randomUUID(),
            name: url.split('/').pop() || 'Unknown file',
            url,
            size: 0, // We don't have size info for existing files
            type: url.includes('.pdf') ? 'application/pdf' : 'image/jpeg'
          }));
        } else {
          sanitizedSpectralFiles[key] = [];
        }
      });

      setSpectralFiles(sanitizedSpectralFiles);
    }
  }, [initialData, formData.pho]);

  useEffect(() => {
    setCurrentSaveError(parentSaveError || null);
  }, [parentSaveError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    if (name === 'tenHC' && formErrors.tenHC) setFormErrors(prev => ({ ...prev, tenHC: undefined }));
    if (name === 'status' && formErrors.status) setFormErrors(prev => ({ ...prev, status: undefined }));
    if ((name === 'selectedLoaiHcInDropdown' || name === 'customLoaiHcInput') && formErrors.loaiHC) {
      setFormErrors(prev => ({ ...prev, loaiHC: undefined }));
    }
    if ((name === 'selectedTrangThaiInDropdown' || name === 'customTrangThaiInput') && formErrors.trangThai) {
        setFormErrors(prev => ({ ...prev, trangThai: undefined }));
    }
    if ((name === 'selectedMauInDropdown' || name === 'customMauInput') && formErrors.mau) {
        setFormErrors(prev => ({ ...prev, mau: undefined }));
    }
    if (name === 'imageUrlInput' && formErrors.hinhCauTruc) {
        setFormErrors(prev => ({ ...prev, hinhCauTruc: undefined }));
    }
    if (currentSaveError) setCurrentSaveError(null);


    if (name === 'selectedLoaiHcInDropdown') {
      setSelectedLoaiHcInDropdown(value);
      if (value === LOAI_HC_OTHER_STRING) {
        setShowCustomLoaiHcInput(true);
        setFormData(prev => ({ ...prev, loaiHC: customLoaiHcInput }));
      } else {
        setShowCustomLoaiHcInput(false);
        setCustomLoaiHcInput('');
        setFormData(prev => ({ ...prev, loaiHC: value }));
      }
    } else if (name === 'customLoaiHcInput') {
      setCustomLoaiHcInput(value);
      if (selectedLoaiHcInDropdown === LOAI_HC_OTHER_STRING) {
        setFormData(prev => ({ ...prev, loaiHC: value }));
      }
    } else if (name === 'selectedTrangThaiInDropdown') {
        setSelectedTrangThaiInDropdown(value);
        if (value === LOAI_HC_OTHER_STRING) {
            setShowCustomTrangThaiInput(true);
            setFormData(prev => ({ ...prev, trangThai: customTrangThaiInput }));
        } else {
            setShowCustomTrangThaiInput(false);
            setCustomTrangThaiInput('');
            setFormData(prev => ({ ...prev, trangThai: value }));
        }
    } else if (name === 'customTrangThaiInput') {
        setCustomTrangThaiInput(value);
        if (selectedTrangThaiInDropdown === LOAI_HC_OTHER_STRING) {
             setFormData(prev => ({ ...prev, trangThai: value }));
        }
    } else if (name === 'selectedMauInDropdown') {
        setSelectedMauInDropdown(value);
        if (value === LOAI_HC_OTHER_STRING) {
            setShowCustomMauInput(true);
            setFormData(prev => ({ ...prev, mau: customMauInput }));
        } else {
            setShowCustomMauInput(false);
            setCustomMauInput('');
            setFormData(prev => ({ ...prev, mau: value }));
        }
    } else if (name === 'customMauInput') {
        setCustomMauInput(value);
        if (selectedMauInDropdown === LOAI_HC_OTHER_STRING) {
            setFormData(prev => ({ ...prev, mau: value }));
        }
    } else if (name === 'imageUrlInput') {
        setImageUrlInput(value);
        if (imageInputMethod === 'url') {
            setFormData(prev => ({ ...prev, hinhCauTruc: value }));
        }
    } else if (name.startsWith('uvSklm.')) {
      const field = name.split('.')[1] as keyof UVSKLMData;
      setFormData(prev => ({
        ...prev,
        uvSklm: { ...prev.uvSklm, [field]: type === 'checkbox' ? checked : value } as UVSKLMData,
      }));
    } else if (name === 'cauHinhTuyetDoi') {
        setFormData(prev => ({ ...prev, cauHinhTuyetDoi: checked as boolean }));
    } else if (name === 'sttHC') {
        setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleImageInputMethodChange = (method: ImageInputMethod) => {
    setImageInputMethod(method);
    setFormData(prev => ({ ...prev, hinhCauTruc: '' }));
    setImageUrlInput('');
    setStructureImageFileName('');
    const fileInput = document.getElementById('hinhCauTrucFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setFormErrors(prev => ({ ...prev, hinhCauTruc: undefined }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && imageInputMethod === 'upload') {
      // Validate file type for structure image
      const allowedImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];

      if (!allowedImageTypes.includes(file.type)) {
        setFormErrors(prev => ({ ...prev, hinhCauTruc: 'Please upload only image files (JPG, PNG, GIF, WebP, SVG).' }));
        // Clear the file input
        e.target.value = '';
        return;
      }

      try {
        const url = await uploadFile(file);
        setFormData(prev => ({ ...prev, hinhCauTruc: url }));
        setStructureImageFileName(file.name);
        setFormErrors(prev => ({ ...prev, hinhCauTruc: undefined }));
      } catch {
        setFormErrors(prev => ({ ...prev, hinhCauTruc: 'File upload failed' }));
      }
    }
  };

  const removeStructureImage = async () => {
    // Delete file from S3/MinIO bucket if it exists and is a URL
    if (formData.hinhCauTruc && formData.hinhCauTruc.startsWith('http')) {
      try {
        await deleteFile(formData.hinhCauTruc);
      } catch (error) {
        console.error('Failed to delete structure image from bucket:', error);
        // Continue with UI removal even if bucket deletion fails
      }
    }

    // Clear frontend state
    setFormData(prev => ({ ...prev, hinhCauTruc: '' }));
    setImageUrlInput('');
    setStructureImageFileName('');
    const fileInput = document.getElementById('hinhCauTrucFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSpectralInputMethodChange = (fieldKey: keyof SpectralRecord, method: SpectralInputMethod) => {
    setSpectralInputMethods(prev => ({ ...prev, [fieldKey]: method }));
    setFormData(prev => ({ ...prev, pho: { ...prev.pho, [fieldKey]: [] } }));
    setSpectralUrlInputs(prev => ({ ...prev, [fieldKey]: [] }));
    const fileInput = document.getElementById(`spectral-file-${fieldKey}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setFormErrors(prev => {
      const newPhoErrors = { ...(prev.pho || {}) };
      delete newPhoErrors[fieldKey];
      return { ...prev, pho: newPhoErrors };
    });
  };

  const handleSpectralUrlInputChange = (fieldKey: keyof SpectralRecord, index: number, value: string) => {
    setSpectralUrlInputs(prev => {
      const newUrls = [...(prev[fieldKey] || [])];
      newUrls[index] = value;
      return { ...prev, [fieldKey]: newUrls };
    });
    setFormData(prev => ({ ...prev, pho: { ...prev.pho, [fieldKey]: spectralUrlInputs[fieldKey] || [] } }));
    setFormErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors.pho) {
        delete newErrors.pho[fieldKey];
      }
      return newErrors;
    });
  };

  const addSpectralUrl = (fieldKey: keyof SpectralRecord) => {
    setSpectralUrlInputs(prev => {
      const currentUrls = prev[fieldKey] || [];
      return { ...prev, [fieldKey]: [...currentUrls, ''] };
    });
  };

  const removeSpectralUrl = (fieldKey: keyof SpectralRecord, index: number) => {
    setSpectralUrlInputs(prev => {
      const currentUrls = prev[fieldKey] || [];
      const newUrls = currentUrls.filter((_, i) => i !== index);
      return { ...prev, [fieldKey]: newUrls };
    });
    setFormData(prev => ({ ...prev, pho: { ...prev.pho, [fieldKey]: spectralUrlInputs[fieldKey]?.filter((_, i) => i !== index) || [] } }));
  };

  const removeAllSpectralUrls = (fieldKey: keyof SpectralRecord) => {
    setSpectralUrlInputs(prev => ({ ...prev, [fieldKey]: [] }));
    setFormData(prev => ({ ...prev, pho: { ...prev.pho, [fieldKey]: [] } }));
  };

  // New handlers for multiple files
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
      const newFileInfos = await uploadMultipleFiles(files);

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

    } catch {
      setFormErrors(prev => ({
        ...prev,
        pho: {
          ...(prev.pho || {}),
          [fieldKey]: 'File upload failed'
        }
      }));
    }
  };

  const removeSpectralFile = async (fieldKey: keyof SpectralRecord, fileId: string) => {
    // Find the file to get its URL before removing from state
    const fileToRemove = spectralFiles[fieldKey].find(f => f.id === fileId);

    if (fileToRemove) {
      try {
        // Delete file from S3/MinIO bucket
        await deleteFile(fileToRemove.url);
      } catch (error) {
        console.error('Failed to delete file from bucket:', error);
        // Continue with UI removal even if bucket deletion fails
      }
    }

    // Remove from frontend state
    setSpectralFiles(prev => ({
      ...prev,
      [fieldKey]: prev[fieldKey].filter(file => file.id !== fileId)
    }));

    setFormData(prev => ({
      ...prev,
      pho: {
        ...prev.pho,
        [fieldKey]: (prev.pho[fieldKey] || []).filter((_, index) => {
          const fileToRemove = spectralFiles[fieldKey].find(f => f.id === fileId);
          return fileToRemove ? (prev.pho[fieldKey] || [])[index] !== fileToRemove.url : true;
        })
      }
    }));
  };

  const removeAllSpectralFiles = async (fieldKey: keyof SpectralRecord) => {
    // Get all files to delete from bucket
    const filesToDelete = spectralFiles[fieldKey] || [];

    // Delete all files from S3/MinIO bucket
    const deletePromises = filesToDelete.map(async (file) => {
      try {
        await deleteFile(file.url);
      } catch (error) {
        console.error('Failed to delete file from bucket:', file.url, error);
        // Continue with other deletions even if some fail
      }
    });

    await Promise.all(deletePromises);

    // Remove from frontend state
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

  // Add NMR block
  const addNmrDataBlock = () => {
    setFormData(prev => ({
      ...prev,
      nmrData: [
        ...prev.nmrData,
        { ...initialNMRDataBlock, id: crypto.randomUUID() }
      ]
    }));
    setSelectedNmrIndex(formData.nmrData.length); // select the new block
  };

  // Remove NMR block
  const removeNmrDataBlock = (index: number) => {
    setFormData(prev => {
      const newBlocks = prev.nmrData.filter((_, i) => i !== index);
      return {
        ...prev,
        nmrData: newBlocks.length > 0 ? newBlocks : [{ ...initialNMRDataBlock, id: crypto.randomUUID() }]
      };
    });
    setSelectedNmrIndex(0);
  };

  // Switch NMR block
  const selectNmrDataBlock = (index: number) => setSelectedNmrIndex(index);

  // Update NMR handlers to work on selected block
  const handleNmrDataBlockFieldChange = (field: keyof Omit<NMRDataBlock, 'signals' | 'id' | 'nmrConditions'>, value: string) => {
    setFormData(prev => {
      const nmrData = [...prev.nmrData];
      nmrData[selectedNmrIndex] = { ...nmrData[selectedNmrIndex], [field]: value };
      return { ...prev, nmrData };
    });
  };
  const handleNmrConditionChange = (field: keyof Omit<NMRCondition, 'id'>, value: string) => {
    setFormData(prev => {
      const nmrData = [...prev.nmrData];
      nmrData[selectedNmrIndex] = {
        ...nmrData[selectedNmrIndex],
        nmrConditions: {
          ...nmrData[selectedNmrIndex].nmrConditions,
          [field]: value
        }
      };
      return { ...prev, nmrData };
    });
  };
  const handleNmrSignalChange = (signalIndex: number, field: keyof Omit<NMRSignalData, 'id'>, value: string) => {
    setFormData(prev => {
      const nmrData = [...prev.nmrData];
      const signals = [...nmrData[selectedNmrIndex].signals];
      signals[signalIndex] = { ...signals[signalIndex], [field]: value };
      nmrData[selectedNmrIndex] = { ...nmrData[selectedNmrIndex], signals };
      return { ...prev, nmrData };
    });
  };
  const addNmrSignal = () => {
    setFormData(prev => {
      const nmrData = [...prev.nmrData];
      nmrData[selectedNmrIndex] = {
        ...nmrData[selectedNmrIndex],
        signals: [...nmrData[selectedNmrIndex].signals, { ...initialNMRSignalData, id: crypto.randomUUID() }]
      };
      return { ...prev, nmrData };
    });
  };
  const addNmrSignalsBulk = (signals: NMRSignalData[]) => {
    setFormData(prev => {
      const nmrData = [...prev.nmrData];
      nmrData[selectedNmrIndex] = {
        ...nmrData[selectedNmrIndex],
        signals: [...nmrData[selectedNmrIndex].signals, ...signals]
      };
      return { ...prev, nmrData };
    });
  };
  const replaceNmrSignals = (signals: NMRSignalData[]) => {
    setFormData(prev => {
      const nmrData = [...prev.nmrData];
      nmrData[selectedNmrIndex] = {
        ...nmrData[selectedNmrIndex],
        signals
      };
      return { ...prev, nmrData };
    });
  };
  const removeNmrSignal = (signalIndex: number) => {
    setFormData(prev => {
      const nmrData = [...prev.nmrData];
      const signals = nmrData[selectedNmrIndex].signals.filter((_, idx) => idx !== signalIndex);
      nmrData[selectedNmrIndex] = { ...nmrData[selectedNmrIndex], signals };
      return { ...prev, nmrData };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) return; // Prevent multiple submissions

    const errors: FormErrors = {};
    if (!formData.tenHC || formData.tenHC.trim() === '') {
        errors.tenHC = t('compoundForm.tenHC') + " is required.";
    }
    if (formData.status === '') {
        errors.status = t('compoundForm.statusLabel') + " is required.";
    }

    let finalLoaiHc = selectedLoaiHcInDropdown;
    if (selectedLoaiHcInDropdown === LOAI_HC_OTHER_STRING) {
      finalLoaiHc = customLoaiHcInput.trim();
    } else if (selectedLoaiHcInDropdown === '') {
      finalLoaiHc = '';
    }
    if (finalLoaiHc === '') {
        errors.loaiHC = t('compoundForm.loaiHC') + " is required.";
    }

    let finalTrangThai = selectedTrangThaiInDropdown;
    if (selectedTrangThaiInDropdown === LOAI_HC_OTHER_STRING) {
        finalTrangThai = customTrangThaiInput.trim();
    } else if (selectedTrangThaiInDropdown === '') {
        finalTrangThai = '';
    }
    if (finalTrangThai === '') {
        errors.trangThai = t('compoundForm.physicalProperties.title') + " - " + t('excelExport.mainInfo.state').replace(':','') + " is required.";
    }

    let finalMau = selectedMauInDropdown;
    if (selectedMauInDropdown === LOAI_HC_OTHER_STRING) {
        finalMau = customMauInput.trim();
    } else if (selectedMauInDropdown === '') {
        finalMau = '';
    }
    if (finalMau === '') {
        errors.mau = t('compoundForm.physicalProperties.title') + " - " + t('excelExport.mainInfo.color').replace(':','') + " is required.";
    }

    if (imageInputMethod === 'url' && formData.hinhCauTruc && !formData.hinhCauTruc.startsWith('http')) {
        errors.hinhCauTruc = "Please enter a valid HTTP/S URL for the image.";
    }

    // Validate spectral data
    const phoErrors: Partial<Record<keyof SpectralRecord, string>> = {};
    SPECTRAL_FIELDS.forEach(field => {
      const fieldKey = field.key;
      const currentMethod = spectralInputMethods[fieldKey] || 'upload';
      const fieldLabel = t(`spectralFields.${field.key}`, field.label);

      if (currentMethod === 'url') {
        const urls = spectralUrlInputs[fieldKey] || [];
        const nonEmptyUrls = urls.filter(url => url.trim() !== '');

        if (nonEmptyUrls.length > 0) {
          // Check if all non-empty URLs are valid
          const invalidUrls = nonEmptyUrls.filter(url => !url.startsWith('http'));
          if (invalidUrls.length > 0) {
            phoErrors[fieldKey] = `For ${fieldLabel}, please enter valid HTTP/S URLs.`;
          }
        }
      }
    });
    if (Object.keys(phoErrors).length > 0) {
      errors.pho = phoErrors;
    }

    if (Object.keys(errors).length > 0 || (errors.pho && Object.keys(errors.pho).length > 0)) {
        setFormErrors(errors);

        // Collect all validation error messages for notification
        const errorMessages: string[] = [];

        if (errors.tenHC) errorMessages.push(errors.tenHC);
        if (errors.status) errorMessages.push(errors.status);
        if (errors.loaiHC) errorMessages.push(errors.loaiHC);
        if (errors.trangThai) errorMessages.push(errors.trangThai);
        if (errors.mau) errorMessages.push(errors.mau);
        if (errors.hinhCauTruc) errorMessages.push(errors.hinhCauTruc);
        if (errors.pho) {
          Object.values(errors.pho).forEach(error => {
            if (error) errorMessages.push(error);
          });
        }

        setValidationNotification({
          show: true,
          errors: errorMessages
        });

        // Scroll to top to show notification
        window.scrollTo({ top: 0, behavior: 'smooth' });

        return;
    }
    setFormErrors({});
    setValidationNotification({ show: false, errors: [] });

    const dataToSave: CompoundData = {
        ...formData,
        loaiHC: finalLoaiHc,
        status: formData.status as CompoundStatus,
        trangThai: finalTrangThai,
        mau: finalMau,
        hinhCauTruc: imageInputMethod === 'url' ? imageUrlInput.trim() : formData.hinhCauTruc,
        pho: SPECTRAL_FIELDS.reduce((acc, field) => {
          const fieldKey = field.key;
          const currentMethod = spectralInputMethods[fieldKey] || 'upload';

          if (currentMethod === 'upload') {
            // Use uploaded files
            acc[fieldKey] = spectralFiles[fieldKey]?.map(file => file.url) || [];
          } else {
            // Use URL inputs (filter out empty URLs)
            acc[fieldKey] = (spectralUrlInputs[fieldKey] || []).filter(url => url.trim() !== '');
          }

          return acc;
        }, {} as SpectralRecord),
        nmrData: formData.nmrData.map(block => ({
          ...block,
          id: block.id || crypto.randomUUID(),
          nmrConditions: {
            ...(block.nmrConditions || initialNMRCondition),
            id: (block.nmrConditions && block.nmrConditions.id) ? block.nmrConditions.id : crypto.randomUUID(),
          },
          signals: (block.signals || []).map(s => ({ ...s, id: s.id || crypto.randomUUID() }))
        })),
    };

    await onSave(dataToSave);
  };

  const handleCancel = () => {
    requestAnimationFrame(() => {
      navigate(-1);
    });
  };

  const statusOptions = COMPOUND_STATUS_OPTIONS_KEYS.map(option => ({
    value: option.value,
    label: t(option.labelKey)
  }));


  const sttHCDisplayValue = (formData.sttHC === 0 && !initialData) ? '' : String(formData.sttHC);
  const sttHCPlaceholder = (formData.sttHC === 0 && !initialData) ? t('compoundForm.sttHCPlaceholder') : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto bg-gray-50 rounded-xl shadow-2xl">
      {validationNotification.show && (
        <Notification
          type="error"
          title={t('compoundForm.validationErrors')}
          message={validationNotification.errors}
          onClose={() => setValidationNotification({ show: false, errors: [] })}
          className="mb-6"
        />
      )}
      <SectionCard title={t('compoundForm.generalInfo.title')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <div>
            <Input
              label={t('compoundForm.sttHC')}
              name="sttHC"
              value={sttHCDisplayValue}
              placeholder={sttHCPlaceholder}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <Input label={t('compoundForm.tenHC')} name="tenHC" value={formData.tenHC} onChange={handleChange} aria-describedby="tenHC-error" required />
            {formErrors.tenHC && <p id="tenHC-error" className="text-red-500 text-xs mt-1 mb-3">{formErrors.tenHC}</p>}
          </div>
        </div>
        <Input label={t('compoundForm.tenHCKhac')} name="tenHCKhac" value={formData.tenHCKhac || ''} onChange={handleChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <div>
            <Select
              label={t('compoundForm.loaiHC')}
              name="selectedLoaiHcInDropdown"
              value={selectedLoaiHcInDropdown}
              onChange={handleChange}
              options={loaiHcDropdownOptions}
              placeholder={t('compoundForm.selectLoaiHC')}
              aria-describedby="loaiHC-error"
              required
            />
            {showCustomLoaiHcInput && (
              <Input
                name="customLoaiHcInput"
                value={customLoaiHcInput}
                onChange={handleChange}
                placeholder={t('compoundForm.customLoaiHCPlaceholder')}
                className="mt-2"
                aria-describedby="loaiHC-error"
              />
            )}
            {formErrors.loaiHC && <p id="loaiHC-error" className="text-red-500 text-xs mt-1 mb-3">{formErrors.loaiHC}</p>}
          </div>
          <div>
            <Select
              label={t('compoundForm.statusLabel')}
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              placeholder={t('compoundForm.selectStatus')}
              aria-describedby="status-error"
              required
            />
            {formErrors.status && <p id="status-error" className="text-red-500 text-xs mt-1 mb-3">{formErrors.status}</p>}
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('compoundForm.source.title')}>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label={t('excelExport.mainInfo.latinName').replace(':','')} name="tenLatin" value={formData.tenLatin || ''} onChange={handleChange} />
            <Input label={t('excelExport.mainInfo.englishName').replace(':','')} name="tenTA" value={formData.tenTA || ''} onChange={handleChange} />
        </div>
        <Input label={t('excelExport.mainInfo.vietnameseName').replace(':','')} name="tenTV" value={formData.tenTV || ''} onChange={handleChange} />
        <Input label={t('excelExport.mainInfo.researchPart').replace(':','')} name="bpnc" value={formData.bpnc || ''} onChange={handleChange} />
        <Textarea label={t('compoundForm.otherSources')} name="nguonKhac" value={formData.nguonKhac || ''} onChange={handleChange} />
      </SectionCard>

      <SectionCard title={t('compoundForm.physicalProperties.title')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
                 <Select
                    label={t('excelExport.mainInfo.state').replace(':','')}
                    name="selectedTrangThaiInDropdown"
                    value={selectedTrangThaiInDropdown}
                    onChange={handleChange}
                    options={trangThaiDropdownOptions}
                    placeholder={t('compoundForm.selectTrangThai')}
                    aria-describedby="trangThai-error"
                    required
                    />
                {showCustomTrangThaiInput && (
                    <Input
                        name="customTrangThaiInput"
                        value={customTrangThaiInput}
                        onChange={handleChange}
                        placeholder={t('compoundForm.customLoaiHCPlaceholder')}
                        className="mt-2"
                        aria-describedby="trangThai-error"
                    />
                )}
                {formErrors.trangThai && <p id="trangThai-error" className="text-red-500 text-xs mt-1 mb-3">{formErrors.trangThai}</p>}
            </div>
            <div>
                 <Select
                    label={t('excelExport.mainInfo.color').replace(':','')}
                    name="selectedMauInDropdown"
                    value={selectedMauInDropdown}
                    onChange={handleChange}
                    options={mauDropdownOptions}
                    placeholder={t('compoundForm.selectMau')}
                    aria-describedby="mau-error"
                    required
                    />
                {showCustomMauInput && (
                    <Input
                        name="customMauInput"
                        value={customMauInput}
                        onChange={handleChange}
                        placeholder={t('compoundForm.customLoaiHCPlaceholder')}
                        className="mt-2"
                        aria-describedby="mau-error"
                    />
                )}
                {formErrors.mau && <p id="mau-error" className="text-red-500 text-xs mt-1 mb-3">{formErrors.mau}</p>}
            </div>
        </div>
        <fieldset className="mt-6 border p-4 rounded-md">
            <legend className="text-md font-medium px-1 text-gray-700">{t('excelExport.mainInfo.uvSklm')}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                <div className="flex items-center space-x-3">
                    <input
                        id="uvSklm.nm254"
                        name="uvSklm.nm254"
                        type="checkbox"
                        checked={!!formData.uvSklm?.nm254}
                        onChange={handleChange}
                        className="custom-styled-checkbox"
                    />
                    <label htmlFor="uvSklm.nm254" className="text-sm font-medium text-gray-700">
                        {t('excelExport.mainInfo.uv254nm')}
                    </label>
                </div>
                <div className="flex items-center space-x-3">
                    <input
                        id="uvSklm.nm365"
                        name="uvSklm.nm365"
                        type="checkbox"
                        checked={!!formData.uvSklm?.nm365}
                        onChange={handleChange}
                        className="custom-styled-checkbox"
                    />
                    <label htmlFor="uvSklm.nm365" className="text-sm font-medium text-gray-700">
                        {t('excelExport.mainInfo.uv365nm')}
                    </label>
                </div>
            </div>
        </fieldset>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-4">
            <Input label={t('excelExport.mainInfo.meltingPoint')} name="diemNongChay" value={formData.diemNongChay || ''} onChange={handleChange} />
            <Input label={t('excelExport.mainInfo.opticalRotation')} name="alphaD" value={formData.alphaD || ''} onChange={handleChange} />
        </div>
        <div>
            <Input
                label={t('excelExport.mainInfo.solventTCVL').replace(':','')}
                name="dungMoiHoaTanTCVL"
                value={formData.dungMoiHoaTanTCVL || ''}
                onChange={handleChange}
                placeholder="e.g., CHCl_3, H_2O, DMSO"
                wrapperClassName="mb-1"
            />
            <p className="text-xs text-gray-500 px-1 mb-4">
              <Trans
                i18nKey="formulaHelpText"
                components={{
                  code1: <code key="code1" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code2: <code key="code2" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code3: <code key="code3" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code4: <code key="code4" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />
                }}
              />
            </p>
        </div>
      </SectionCard>

      <SectionCard title={t('compoundForm.structure.title')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <div>
            <Input
              label={t('excelExport.mainInfo.molecularFormula')}
              name="ctpt"
              value={formData.ctpt || ''}
              onChange={handleChange}
              placeholder="e.g., H_2O, C_6H_{12}O_6, SO_4^{2-}"
              wrapperClassName="mb-1"
            />
            <p className="text-xs text-gray-500 px-1 mb-4">
              <Trans
                i18nKey="formulaHelpText"
                components={{
                  code1: <code key="code1" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code2: <code key="code2" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code3: <code key="code3" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code4: <code key="code4" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />
                }}
              />
            </p>
          </div>
          <Input label={t('excelExport.mainInfo.molecularWeight')} name="klpt" value={formData.klpt || ''} onChange={handleChange} />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('compoundForm.structureImage')}
            </label>
            <div className="flex space-x-4 mb-2">
                <label className="flex items-center space-x-2">
                    <input
                        type="radio"
                        name="imageInputMethod"
                        value="upload"
                        checked={imageInputMethod === 'upload'}
                        onChange={() => handleImageInputMethodChange('upload')}
                        className="custom-styled-radio"
                    />
                    <span className="text-sm text-gray-700">{t('compoundForm.uploadFile')}</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input
                        type="radio"
                        name="imageInputMethod"
                        value="url"
                        checked={imageInputMethod === 'url'}
                        onChange={() => handleImageInputMethodChange('url')}
                        className="custom-styled-radio"
                    />
                    <span className="text-sm text-gray-700">{t('compoundForm.enterURL')}</span>
                </label>
            </div>

            {imageInputMethod === 'upload' && (
                <CustomFileInput
                  id="hinhCauTrucFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  label={t('compoundForm.browse')}
                  selectedFileName={structureImageFileName}
                  placeholder={t('compoundForm.noFileSelected')}
                  wrapperClassName="mt-1"
                />
            )}
            {imageInputMethod === 'url' && (
                <Input
                    name="imageUrlInput"
                    type="url"
                    value={imageUrlInput}
                    onChange={handleChange}
                    placeholder="https://example.com/image.png"
                    className="mt-1"
                    aria-describedby="hinhCauTruc-error"
                />
            )}
             {formErrors.hinhCauTruc && <p id="hinhCauTruc-error" className="text-red-500 text-xs mt-1 mb-3">{formErrors.hinhCauTruc}</p>}

            {formData.hinhCauTruc && (
                <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">{t('compoundForm.preview')}</p>
                    <img
                        src={getImageUrl(formData.hinhCauTruc)}
                        alt="Structure Preview"
                        className="mt-2 max-w-xs max-h-60 border rounded-md shadow-sm"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        onLoad={(e) => (e.currentTarget.style.display = 'block')}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => await removeStructureImage()}
                        className="mt-2 text-red-600 hover:bg-red-50"
                        leftIcon={<TrashIcon className="w-4 h-4"/>}
                    >
                        {t('buttons.removeImage')}
                    </Button>
                </div>
            )}
        </div>

        <div className="mb-4">
            <label htmlFor="cauHinhTuyetDoi" className="flex items-center text-sm font-medium text-gray-700">
                <input
                    id="cauHinhTuyetDoi"
                    name="cauHinhTuyetDoi"
                    type="checkbox"
                    checked={!!formData.cauHinhTuyetDoi}
                    onChange={handleChange}
                    className="custom-styled-checkbox"
                />
                {t('excelExport.mainInfo.absoluteConfiguration').replace(':','')}
            </label>
        </div>
      </SectionCard>

      <SectionCard title={t('compoundForm.smiles.title')}>
        <Input name="smiles" value={formData.smiles || ''} onChange={handleChange} />
      </SectionCard>

      <SectionCard title={t('compoundForm.spectra.title')}>
        <div className="space-y-6">
          {SPECTRAL_FIELDS.map(field => {
            const fieldKey = field.key;
            const currentMethod = spectralInputMethods[fieldKey] || 'upload';
            const fieldLabel = t(`spectralFields.${field.key}`, field.label); // Translate label

            return (
              <div key={fieldKey} className="p-4 border border-gray-200 rounded-md bg-slate-50 shadow-sm">
                <h4 className="text-md font-semibold text-gray-700 mb-3">{fieldLabel}</h4>

                <div className="flex space-x-4 mb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`spectralMethod-${fieldKey}`}
                      value="upload"
                      checked={currentMethod === 'upload'}
                      onChange={() => handleSpectralInputMethodChange(fieldKey, 'upload')}
                      className="custom-styled-radio"
                    />
                    <span className="text-sm text-gray-700">{t('compoundForm.uploadFile')}</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`spectralMethod-${fieldKey}`}
                      value="url"
                      checked={currentMethod === 'url'}
                      onChange={() => handleSpectralInputMethodChange(fieldKey, 'url')}
                      className="custom-styled-radio"
                    />
                    <span className="text-sm text-gray-700">{t('compoundForm.enterURL')}</span>
                  </label>
                </div>

                {currentMethod === 'upload' && (
                  <div className="space-y-4">
                    <MultiFileInput
                      id={`spectral-file-${fieldKey}`}
                      selectedFiles={spectralFiles[fieldKey] || []}
                      onChange={(files) => handleSpectralMultipleFileChange(fieldKey, files)}
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,image/*,application/pdf"
                      maxFiles={10}
                      wrapperClassName="mt-1"
                    />

                    <SpectralFilesPreview
                      files={spectralFiles[fieldKey] || []}
                      fieldLabel={fieldLabel}
                      onRemoveFile={async (fileId) => await removeSpectralFile(fieldKey, fileId)}
                      onRemoveAll={async () => await removeAllSpectralFiles(fieldKey)}
                    />
                  </div>
                )}
                {currentMethod === 'url' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {(spectralUrlInputs[fieldKey] || []).map((url, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="url"
                            value={url}
                            onChange={(e) => handleSpectralUrlInputChange(fieldKey, index, e.target.value)}
                            placeholder={`https://example.com/${fieldLabel.toLowerCase().replace(' ', '-')}-${index + 1}.pdf`}
                            className="flex-1"
                            aria-describedby={`pho-error-${fieldKey}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeSpectralUrl(fieldKey, index)}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          >
                            {t('fileUpload.remove')}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      {(spectralUrlInputs[fieldKey] || []).length < 10 && (
                        <button
                          type="button"
                          onClick={() => addSpectralUrl(fieldKey)}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {t('fileUpload.addUrl')}
                        </button>
                      )}
                      {(spectralUrlInputs[fieldKey] || []).length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeAllSpectralUrls(fieldKey)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          {t('fileUpload.removeAll')}
                        </button>
                      )}
                    </div>

                    {(spectralUrlInputs[fieldKey] || []).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {t('fileUpload.noUrlsAdded')}
                      </p>
                    )}
                  </div>
                )}
                {formErrors.pho?.[fieldKey] && <p id={`pho-error-${fieldKey}`} className="text-red-500 text-xs mt-1 mb-3">{formErrors.pho[fieldKey]}</p>}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title={t('compoundForm.nmrSolvent.title')}>
        <div>
            <Input
                label={t('excelExport.mainInfo.nmrSolvent').replace(':','')}
                name="dmNMRGeneral"
                value={formData.dmNMRGeneral || ''}
                onChange={handleChange}
                placeholder="e.g., CDCl_3, DMSO-d_6"
                wrapperClassName="mb-1"
            />
            <p className="text-xs text-gray-500 px-1 mb-4">
              <Trans
                i18nKey="formulaHelpText"
                components={{
                  code1: <code key="code1" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code2: <code key="code2" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code3: <code key="code3" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                  code4: <code key="code4" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />
                }}
              />
            </p>
        </div>
      </SectionCard>

      <SectionCard title={t('compoundForm.compChem.title')}>
        <Input label={t('excelExport.mainInfo.cartCoords')} name="cartCoor" value={formData.cartCoor || ''} onChange={handleChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input label={t('excelExport.mainInfo.imaginaryFreq')} name="imgFreq" value={formData.imgFreq || ''} onChange={handleChange} />
            <Input label={t('excelExport.mainInfo.totalEnergy')} name="te" value={formData.te || ''} onChange={handleChange} />
        </div>
      </SectionCard>

      <SectionCard title={t('compoundForm.nmrData.title')}>
        <div className="flex items-center mb-4 space-x-2">
          {formData.nmrData.map((block, idx) => (
            <button
              key={block.id || idx}
              type="button"
              className={`px-3 py-1 rounded border ${selectedNmrIndex === idx ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border-indigo-300'} font-medium text-sm mr-1`}
              onClick={() => selectNmrDataBlock(idx)}
            >
              {t('nmrForm.spectralDataTable')} #{idx + 1}
            </button>
          ))}
          <Button type="button" size="sm" variant="secondary" onClick={addNmrDataBlock} leftIcon={<span>+</span>}>
            {t('nmrForm.addSpectralTable', 'Add Table')}
          </Button>
          {formData.nmrData.length > 1 && (
            <Button type="button" size="sm" variant="ghost" onClick={() => removeNmrDataBlock(selectedNmrIndex)} leftIcon={<span>-</span>}>
              {t('nmrForm.removeSpectralTable', 'Remove Table')}
            </Button>
          )}
        </div>
        <SingleNMRDataForm
          nmrDataBlock={formData.nmrData[selectedNmrIndex]}
          onFieldChange={handleNmrDataBlockFieldChange}
          onConditionChange={handleNmrConditionChange}
          onSignalChange={handleNmrSignalChange}
          onAddSignal={addNmrSignal}
          onAddSignalsBulk={addNmrSignalsBulk}
          onReplaceSignals={replaceNmrSignals}
          onRemoveSignal={removeNmrSignal}
        />
      </SectionCard>

      {currentSaveError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          <span className="font-medium">Save Error:</span> {currentSaveError}
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-8 border-t border-gray-300">
        <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSaving}>{t('buttons.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={isSaving} loading={isSaving}>
          {initialData ? t('buttons.update') : t('buttons.save')}
        </Button>
      </div>
    </form>
  );
};
