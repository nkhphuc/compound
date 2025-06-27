import { CompoundStatus } from './types';
import type { SpectralRecord } from './types';

// For COMPOUND_STATUS_OPTIONS, the labels will be generated dynamically using t(CompoundStatus.NEW) or t(CompoundStatus.KNOWN)
// For example, in CompoundForm:
// const { t } = useTranslation();
// const statusOptions = [
//   { value: CompoundStatus.NEW, label: t(CompoundStatus.NEW) }, // Assuming 'Mới' is a key in translations
//   { value: CompoundStatus.KNOWN, label: t(CompoundStatus.KNOWN) } // Assuming 'Đã biết' is a key
// ];
// Or, if CompoundStatus enum values are used as keys:
//   { value: CompoundStatus.NEW, label: t(`compoundStatus.${CompoundStatus.NEW}`) },
// For now, the translation files have direct keys like "Mới": "New" for English.

export const COMPOUND_STATUS_OPTIONS_KEYS = [
  { value: CompoundStatus.NEW, labelKey: `compoundStatus.${CompoundStatus.NEW}` },
  { value: CompoundStatus.KNOWN, labelKey: `compoundStatus.${CompoundStatus.KNOWN}` },
];


export const SPECTRAL_FIELDS_CONFIG: Array<{ key: keyof SpectralRecord; labelKey: string }> = [
  { key: '1h', labelKey: 'spectralFields.1h' },
  { key: '13c', labelKey: 'spectralFields.13c' },
  { key: 'dept', labelKey: 'spectralFields.dept' },
  { key: 'hsqc', labelKey: 'spectralFields.hsqc' },
  { key: 'hmbc', labelKey: 'spectralFields.hmbc' },
  { key: 'cosy', labelKey: 'spectralFields.cosy' },
  { key: 'noesy', labelKey: 'spectralFields.noesy' },
  { key: 'roesy', labelKey: 'spectralFields.roesy' },
  { key: 'hrms', labelKey: 'spectralFields.hrms' },
  { key: 'lrms', labelKey: 'spectralFields.lrms' },
  { key: 'ir', labelKey: 'spectralFields.ir' },
  { key: 'uv_pho', labelKey: 'spectralFields.uv_pho' },
  { key: 'cd', labelKey: 'spectralFields.cd' },
];

// Deprecated, use SPECTRAL_FIELDS_CONFIG and translate labels
export const SPECTRAL_FIELDS: Array<{ key: keyof SpectralRecord; label: string }> = [
  { key: '1h', label: '1H NMR' },
  { key: '13c', label: '13C NMR' },
  { key: 'dept', label: 'DEPT' },
  { key: 'hsqc', label: 'HSQC' },
  { key: 'hmbc', label: 'HMBC' },
  { key: 'cosy', label: 'COSY' },
  { key: 'noesy', label: 'NOESY' },
  { key: 'roesy', label: 'ROESY' },
  { key: 'hrms', label: 'HRMS' },
  { key: 'lrms', label: 'LRMS' },
  { key: 'ir', label: 'IR' },
  { key: 'uv_pho', label: 'UV' },
  { key: 'cd', label: 'CD' },
];


export const DEFAULT_LOAI_HC_OPTIONS: string[] = [
  "Triterpene",
  "Steroid",
  "Saponin",
  "Flavonoid",
  "Alkaloid",
  "Lignan",
  "Coumarine",
]; // These will need to be translated if used directly as labels.
  // Or map them to translation keys. For simplicity, custom inputs are already supported.

export const DEFAULT_TRANG_THAI_OPTIONS: string[] = [
  "Bột", 
  "Tinh thể",
  "Dầu", 
];

export const DEFAULT_MAU_OPTIONS: string[] = [
  "Đỏ", 
  "Cam", 
  "Vàng", 
  "Trắng", 
];

export const LOAI_HC_OTHER_STRING_KEY = "variousLabels.other"; // Translation key for "Other"
export const LOAI_HC_OTHER_STRING = "Khác"; // Keep original for value comparison if needed, but display t(LOAI_HC_OTHER_STRING_KEY)
