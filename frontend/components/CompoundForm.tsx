import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { CompoundData, initialCompoundData, UVSKLMData, SpectralRecord, NMRDataBlock, NMRSignalData, CompoundStatus, initialNMRDataBlock, initialNMRSignalData, NMRCondition, initialNMRCondition } from '../types';
import { COMPOUND_STATUS_OPTIONS_KEYS, SPECTRAL_FIELDS, DEFAULT_LOAI_HC_OPTIONS, LOAI_HC_OTHER_STRING, DEFAULT_TRANG_THAI_OPTIONS, DEFAULT_MAU_OPTIONS, LOAI_HC_OTHER_STRING_KEY } from '../constants';
import { getUniqueLoaiHCValues, getUniqueTrangThaiValues, getUniqueMauValues } from '../services/compoundService';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { SectionCard } from './SectionCard';
import { SingleNMRDataForm } from './SingleNMRDataForm';
import { TrashIcon } from './icons/TrashIcon';
import { CustomFileInput } from './ui/CustomFileInput';

interface CompoundFormProps {
  initialData?: CompoundData;
  onSave: (data: CompoundData) => Promise<boolean>;
  saveError?: string | null;
  isSaving?: boolean;
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

const initialSpectralUrlsState: Record<keyof SpectralRecord, string> =
  SPECTRAL_FIELDS.reduce((acc, field) => {
    acc[field.key] = ''; // Default empty URL
    return acc;
  }, {} as Record<keyof SpectralRecord, string>);

const initialSpectralFileNamesState: Record<keyof SpectralRecord, string> =
  SPECTRAL_FIELDS.reduce((acc, field) => {
    acc[field.key] = ''; // Default empty file name
    return acc;
  }, {} as Record<keyof SpectralRecord, string>);


export const CompoundForm: React.FC<CompoundFormProps> = ({ initialData, onSave, saveError: parentSaveError, isSaving }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CompoundData>(() => {
    if (initialData) {
      const parsedInitial = JSON.parse(JSON.stringify(initialData));

      // Handle NMRConditions: if array (old data), take first; otherwise, use as is or default
      let initialNmrConditionsObj: NMRCondition;
      const rawNmrConditions = parsedInitial.nmrData?.nmrConditions;
      if (Array.isArray(rawNmrConditions) && rawNmrConditions.length > 0) {
        initialNmrConditionsObj = { ...initialNMRCondition, ...rawNmrConditions[0], id: rawNmrConditions[0].id || crypto.randomUUID() };
      } else if (typeof rawNmrConditions === 'object' && rawNmrConditions !== null && !Array.isArray(rawNmrConditions)) {
        initialNmrConditionsObj = { ...initialNMRCondition, ...rawNmrConditions, id: rawNmrConditions.id || crypto.randomUUID() };
      } else {
        initialNmrConditionsObj = { ...initialNMRCondition, id: crypto.randomUUID() };
      }

      const nmrData = {
        ...(parsedInitial.nmrData || { ...initialNMRDataBlock, id: crypto.randomUUID() }),
        nmrConditions: initialNmrConditionsObj,
        signals: parsedInitial.nmrData?.signals
          ? parsedInitial.nmrData.signals.map((sig: Partial<NMRSignalData>) => ({ ...initialNMRSignalData, ...sig, id: sig.id || crypto.randomUUID() }))
          : []
      };

      const sanitizedPho: SpectralRecord = {} as SpectralRecord;
      SPECTRAL_FIELDS.forEach(field => {
        sanitizedPho[field.key] = typeof parsedInitial.pho?.[field.key] === 'string' ? parsedInitial.pho[field.key] : '';
      });

      return {
        ...initialCompoundData,
        ...parsedInitial,
        status: parsedInitial.status || '',
        loaiHC: parsedInitial.loaiHC || '',
        trangThai: parsedInitial.trangThai || '',
        mau: parsedInitial.mau || '',
        sttHC: typeof parsedInitial.sttHC === 'number' ? parsedInitial.sttHC : parseInt(String(parsedInitial.sttHC), 10) || 0,
        cauHinhTuyetDoi: typeof parsedInitial.cauHinhTuyetDoi === 'boolean' ? parsedInitial.cauHinhTuyetDoi : false,
        pho: sanitizedPho,
        nmrData: nmrData
      };
    }
    // For new compound
    const defaultPho = SPECTRAL_FIELDS.reduce((acc, field) => {
        acc[field.key] = '';
        return acc;
    }, {} as SpectralRecord);

    return {
      ...JSON.parse(JSON.stringify(initialCompoundData)),
      id: '', // Don't generate ID for new compounds - let backend generate it
      nmrData: { ...initialNMRDataBlock, id: '' }, // Don't generate NMR ID either
      pho: defaultPho
    };
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [currentSaveError, setCurrentSaveError] = useState<string | null>(null);

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
  const [spectralUrlInputs, setSpectralUrlInputs] = useState<Record<keyof SpectralRecord, string>>(initialSpectralUrlsState);
  const [spectralFileNames, setSpectralFileNames] = useState<Record<keyof SpectralRecord, string>>(initialSpectralFileNamesState);


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
    const dataToSet = initialData
      ? (() => {
          const parsedInitial = JSON.parse(JSON.stringify(initialData));

          let initialNmrConditionsObj: NMRCondition;
          const rawNmrConditions = parsedInitial.nmrData?.nmrConditions;
          if (Array.isArray(rawNmrConditions) && rawNmrConditions.length > 0) {
            initialNmrConditionsObj = { ...initialNMRCondition, ...rawNmrConditions[0], id: rawNmrConditions[0].id || crypto.randomUUID() };
          } else if (typeof rawNmrConditions === 'object' && rawNmrConditions !== null && !Array.isArray(rawNmrConditions)) {
            initialNmrConditionsObj = { ...initialNMRCondition, ...rawNmrConditions, id: rawNmrConditions.id || crypto.randomUUID() };
          } else {
            initialNmrConditionsObj = { ...initialNMRCondition, id: crypto.randomUUID() };
          }

          const nmrData = {
            ...(parsedInitial.nmrData || { ...initialNMRDataBlock, id: `${parsedInitial.id}-nmr` }),
            nmrConditions: initialNmrConditionsObj,
            signals: parsedInitial.nmrData?.signals
              ? parsedInitial.nmrData.signals.map((sig: Partial<NMRSignalData>) => ({ ...initialNMRSignalData, ...sig, id: sig.id || crypto.randomUUID() }))
              : []
          };

          const sanitizedPho: SpectralRecord = {} as SpectralRecord;
          SPECTRAL_FIELDS.forEach(field => {
            sanitizedPho[field.key] = typeof parsedInitial.pho?.[field.key] === 'string' ? parsedInitial.pho[field.key] : '';
          });

          return {
            ...initialCompoundData,
            ...parsedInitial,
            status: parsedInitial.status || '',
            loaiHC: parsedInitial.loaiHC || '',
            trangThai: parsedInitial.trangThai || '',
            mau: parsedInitial.mau || '',
            sttHC: typeof parsedInitial.sttHC === 'number' ? parsedInitial.sttHC : parseInt(String(parsedInitial.sttHC), 10) || 0,
            cauHinhTuyetDoi: typeof parsedInitial.cauHinhTuyetDoi === 'boolean' ? parsedInitial.cauHinhTuyetDoi : false,
            pho: sanitizedPho,
            nmrData: nmrData
          };
        })()
      : (() => {
          const newId = crypto.randomUUID();
          const defaultPho = SPECTRAL_FIELDS.reduce((acc, field) => {
              acc[field.key] = '';
              return acc;
          }, {} as SpectralRecord);
          return {
            ...JSON.parse(JSON.stringify(initialCompoundData)),
            id: '', // Don't generate ID for new compounds - let backend generate it
            nmrData: { ...initialNMRDataBlock, id: '' }, // Don't generate NMR ID either
            pho: defaultPho
          };
        })();

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

    const iSpectralInputMethods = { ...initialSpectralMethodsState };
    const iSpectralUrlInputs = { ...initialSpectralUrlsState };
    const iSpectralFileNames = { ...initialSpectralFileNamesState };

    SPECTRAL_FIELDS.forEach(sf => {
      const key = sf.key;
      const phoValue = (dataToSet.pho as SpectralRecord)[key];

      if (phoValue) {
        if (phoValue.startsWith('data:')) {
          iSpectralInputMethods[key] = 'upload';
          iSpectralFileNames[key] = t('compoundForm.uploadedFilePlaceholder');
          iSpectralUrlInputs[key] = '';
        } else if (phoValue.startsWith('http')) {
          iSpectralInputMethods[key] = 'url';
          iSpectralUrlInputs[key] = phoValue;
          iSpectralFileNames[key] = '';
        } else {
          iSpectralInputMethods[key] = 'upload';
          iSpectralUrlInputs[key] = '';
          iSpectralFileNames[key] = '';
        }
      }
    });
    setSpectralInputMethods(iSpectralInputMethods);
    setSpectralUrlInputs(iSpectralUrlInputs);
    setSpectralFileNames(iSpectralFileNames);

    setFormErrors({});
    setCurrentSaveError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, t, loaiHcDropdownOptions.length, trangThaiDropdownOptions.length, mauDropdownOptions.length]);


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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && imageInputMethod === 'upload') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, hinhCauTruc: reader.result as string }));
        setStructureImageFileName(file.name);
      };
      reader.readAsDataURL(file);
      setFormErrors(prev => ({ ...prev, hinhCauTruc: undefined }));
    }
  };

  const removeStructureImage = () => {
    setFormData(prev => ({ ...prev, hinhCauTruc: '' }));
    setImageUrlInput('');
    setStructureImageFileName('');
    const fileInput = document.getElementById('hinhCauTrucFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSpectralInputMethodChange = (fieldKey: keyof SpectralRecord, method: SpectralInputMethod) => {
    setSpectralInputMethods(prev => ({ ...prev, [fieldKey]: method }));
    setFormData(prev => ({ ...prev, pho: { ...prev.pho, [fieldKey]: '' } }));
    setSpectralUrlInputs(prev => ({ ...prev, [fieldKey]: '' }));
    setSpectralFileNames(prev => ({ ...prev, [fieldKey]: '' }));
    const fileInput = document.getElementById(`spectral-file-${fieldKey}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setFormErrors(prev => {
      const newPhoErrors = { ...(prev.pho || {}) };
      delete newPhoErrors[fieldKey];
      return { ...prev, pho: newPhoErrors };
    });
  };

  const handleSpectralFileChange = (fieldKey: keyof SpectralRecord, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, pho: { ...prev.pho, [fieldKey]: reader.result as string } }));
        setSpectralFileNames(prev => ({ ...prev, [fieldKey]: file.name }));
      };
      reader.readAsDataURL(file);
      setFormErrors(prev => {
        const newPhoErrors = { ...(prev.pho || {}) };
        delete newPhoErrors[fieldKey];
        return { ...prev, pho: newPhoErrors };
      });
    }
  };

  const handleSpectralUrlInputChange = (fieldKey: keyof SpectralRecord, e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSpectralUrlInputs(prev => ({ ...prev, [fieldKey]: url }));
    if (spectralInputMethods[fieldKey] === 'url') {
      setFormData(prev => ({ ...prev, pho: { ...prev.pho, [fieldKey]: url } }));
      if (url && !url.startsWith('http')) {
        setFormErrors(prev => ({...prev, pho: {...(prev.pho || {}), [fieldKey]: "Please enter a valid HTTP/S URL."}}));
      } else {
        setFormErrors(prev => {
          const newPhoErrors = { ...(prev.pho || {}) };
          delete newPhoErrors[fieldKey];
          return { ...prev, pho: newPhoErrors };
        });
      }
    }
  };

  const removeSpectralData = (fieldKey: keyof SpectralRecord) => {
    setFormData(prev => ({ ...prev, pho: { ...prev.pho, [fieldKey]: '' } }));
    setSpectralUrlInputs(prev => ({ ...prev, [fieldKey]: '' }));
    setSpectralFileNames(prev => ({ ...prev, [fieldKey]: '' }));
    setSpectralInputMethods(prev => ({ ...prev, [fieldKey]: 'upload' }));
    const fileInput = document.getElementById(`spectral-file-${fieldKey}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
     setFormErrors(prev => {
        const newPhoErrors = { ...(prev.pho || {}) };
        delete newPhoErrors[fieldKey];
        return { ...prev, pho: newPhoErrors };
    });
  };

  const handleNmrDataBlockFieldChange = (field: keyof Omit<NMRDataBlock, 'signals' | 'id' | 'nmrConditions'>, value: string) => {
    setFormData(prev => ({ ...prev, nmrData: { ...prev.nmrData, [field]: value } }));
  };

  const handleNmrConditionChange = (field: keyof Omit<NMRCondition, 'id'>, value: string) => { // No index
    setFormData(prev => ({
      ...prev,
      nmrData: {
        ...prev.nmrData,
        nmrConditions: { // Update single object
          ...prev.nmrData.nmrConditions,
          [field]: value,
          id: prev.nmrData.nmrConditions.id || crypto.randomUUID() // Ensure ID
        },
      },
    }));
  };

  const handleNmrSignalChange = (signalIndex: number, field: keyof Omit<NMRSignalData, 'id'>, value: string) => {
    setFormData(prev => {
      const newSignals = [...prev.nmrData.signals];
      newSignals[signalIndex] = { ...newSignals[signalIndex], [field]: value };
      return { ...prev, nmrData: { ...prev.nmrData, signals: newSignals } };
    });
  };

  const addNmrSignal = () => {
    setFormData(prev => ({ ...prev, nmrData: { ...prev.nmrData, signals: [...prev.nmrData.signals, { ...initialNMRSignalData, id: crypto.randomUUID() }] } }));
  };

  const removeNmrSignal = (signalIndex: number) => {
    setFormData(prev => {
      const newSignals = prev.nmrData.signals.filter((_, index) => index !== signalIndex);
      return { ...prev, nmrData: { ...prev.nmrData, signals: newSignals } };
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
    } else if (selectedLoaiHcInDropdown === LOAI_HC_OTHER_STRING && finalLoaiHc === '') {
        errors.loaiHC = "Please enter a custom " + t('compoundForm.loaiHC').toLowerCase() + " if '" + t(LOAI_HC_OTHER_STRING_KEY) + "' is selected.";
    }

    let finalTrangThai = selectedTrangThaiInDropdown;
    if (selectedTrangThaiInDropdown === LOAI_HC_OTHER_STRING) {
        finalTrangThai = customTrangThaiInput.trim();
    } else if (selectedTrangThaiInDropdown === '') {
        finalTrangThai = '';
    }
    if (finalTrangThai === '') {
        errors.trangThai = t('compoundForm.physicalProperties.title') + " - " + t('excelExport.mainInfo.state').replace(':','') + " is required.";
    } else if (selectedTrangThaiInDropdown === LOAI_HC_OTHER_STRING && finalTrangThai === '') {
        errors.trangThai = "Please enter a custom state/phase if '" + t(LOAI_HC_OTHER_STRING_KEY) + "' is selected.";
    }

    let finalMau = selectedMauInDropdown;
    if (selectedMauInDropdown === LOAI_HC_OTHER_STRING) {
        finalMau = customMauInput.trim();
    } else if (selectedMauInDropdown === '') {
        finalMau = '';
    }
    if (finalMau === '') {
        errors.mau = t('compoundForm.physicalProperties.title') + " - " + t('excelExport.mainInfo.color').replace(':','') + " is required.";
    } else if (selectedMauInDropdown === LOAI_HC_OTHER_STRING && finalMau === '') {
        errors.mau = "Please enter a custom color if '" + t(LOAI_HC_OTHER_STRING_KEY) + "' is selected.";
    }

    if (imageInputMethod === 'url' && formData.hinhCauTruc && !formData.hinhCauTruc.startsWith('http')) {
        errors.hinhCauTruc = "Please enter a valid HTTP/S URL for the image.";
    }

    const phoErrors: Partial<Record<keyof SpectralRecord, string>> = {};
    SPECTRAL_FIELDS.forEach(sf => {
      const key = sf.key;
      const phoValue = formData.pho[key];
      const label = t(`spectralFields.${key}`, sf.label);
      if (spectralInputMethods[key] === 'url' && phoValue && !phoValue.startsWith('http')) {
        phoErrors[key] = `For ${label}, please enter a valid HTTP/S URL.`;
      }
    });
    if (Object.keys(phoErrors).length > 0) {
      errors.pho = phoErrors;
    }

    if (Object.keys(errors).length > 0 || (errors.pho && Object.keys(errors.pho).length > 0)) {
        setFormErrors(errors);
        return;
    }
    setFormErrors({});

    const dataToSave: CompoundData = {
        ...formData,
        sttHC: Number(formData.sttHC) || 0,
        loaiHC: finalLoaiHc,
        status: formData.status as CompoundStatus,
        trangThai: finalTrangThai,
        mau: finalMau,
        hinhCauTruc: imageInputMethod === 'url' ? imageUrlInput.trim() : formData.hinhCauTruc,
        nmrData: {
          ...formData.nmrData,
          id: formData.nmrData.id || `${formData.id}-nmr`,
          nmrConditions: {
             ...(formData.nmrData.nmrConditions || initialNMRCondition),
             id: (formData.nmrData.nmrConditions && formData.nmrData.nmrConditions.id) ? formData.nmrData.nmrConditions.id : crypto.randomUUID(),
          },
          signals: formData.nmrData.signals.map(s => ({...s, id: s.id || crypto.randomUUID()})),
        }
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
                        src={formData.hinhCauTruc}
                        alt="Structure Preview"
                        className="mt-2 max-w-xs max-h-60 border rounded-md shadow-sm"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        onLoad={(e) => (e.currentTarget.style.display = 'block')}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeStructureImage}
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
            const currentData = formData.pho[fieldKey];
            const currentMethod = spectralInputMethods[fieldKey];
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
                  <CustomFileInput
                    id={`spectral-file-${fieldKey}`}
                    onChange={(e) => handleSpectralFileChange(fieldKey, e)}
                    label={t('compoundForm.browse')}
                    selectedFileName={spectralFileNames[fieldKey]}
                    placeholder={t('compoundForm.noFileSelected')}
                    wrapperClassName="mt-1"
                  />
                )}
                {currentMethod === 'url' && (
                  <Input
                    type="url"
                    value={spectralUrlInputs[fieldKey] || ''}
                    onChange={(e) => handleSpectralUrlInputChange(fieldKey, e)}
                    placeholder={`https://example.com/${fieldLabel.toLowerCase().replace(' ', '-')}.pdf`}
                    className="mt-1 w-full"
                    aria-describedby={`pho-error-${fieldKey}`}
                  />
                )}
                {formErrors.pho?.[fieldKey] && <p id={`pho-error-${fieldKey}`} className="text-red-500 text-xs mt-1 mb-3">{formErrors.pho[fieldKey]}</p>}


                {currentData && (
                  <div className="mt-3">
                    {currentData.startsWith('data:image') && (
                        <img src={currentData} alt={`${fieldLabel} preview`} className="mt-2 max-w-xs max-h-32 border rounded"/>
                    )}
                    {currentData.startsWith('data:application/pdf') && (
                        <a href={currentData} download={`${spectralFileNames[fieldKey] || fieldLabel}.pdf`} className="text-indigo-600 hover:underline text-sm block mt-1">Download PDF</a>
                    )}
                    {currentData.startsWith('http') && (
                       <p className="text-sm text-gray-600 truncate">
                          URL: <a href={currentData} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{currentData}</a>
                       </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpectralData(fieldKey)}
                      className="mt-2 text-red-600 hover:bg-red-50"
                      leftIcon={<TrashIcon className="w-3 h-3"/>}
                    >
                      {t('buttons.remove')}
                    </Button>
                  </div>
                )}
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
        <SingleNMRDataForm
          nmrDataBlock={formData.nmrData}
          onFieldChange={handleNmrDataBlockFieldChange}
          onConditionChange={handleNmrConditionChange}
          // onAddCondition and onRemoveCondition removed
          onSignalChange={handleNmrSignalChange}
          onAddSignal={addNmrSignal}
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
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? t('buttons.saving') : (initialData ? t('buttons.update') : t('buttons.save'))}
        </Button>
      </div>
    </form>
  );
};
