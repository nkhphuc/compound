export enum CompoundStatus {
  NEW = 'Mới', // New
  KNOWN = 'Đã biết', // Known
}

export interface UVSKLMData {
  nm254?: boolean;
  nm365?: boolean;
}

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

export interface NMRSignalData {
  id: string; // Unique ID for the signal row
  viTri: string; // Position
  scab: string;  // δC value
  shacJHz: string; // δH (J, Hz) value
}

export interface NMRCondition {
  id: string; // Unique ID for this condition row
  dmNMR: string; // Solvent for this specific condition e.g. "CDCl3"
  tanSo13C: string; // 13C Frequency for this condition e.g. "151MHz"
  tanSo1H: string; // 1H Frequency for this condition e.g. "600MHz"
}

export interface NMRDataBlock {
  id: string; // Unique ID for this NMR data block (can be compound.id + "-nmr")
  sttBang: string; // Table number, e.g., "1", "2" - now initialized to ""
  nmrConditions: NMRCondition; // << UPDATED: Was NMRCondition[]
  signals: NMRSignalData[];
  luuYNMR: string; // Notes for this table
  tltkNMR: string; // References for this table
}

export interface CompoundData {
  id: string; // Unique ID for the compound
  sttRC: number; // Serial number, now consistently a number
  tenHC: string; // Compound Name
  tenHCKhac?: string; // Other Name
  loaiHC: string; // Compound Type
  status: CompoundStatus | ''; // << UPDATED to allow empty string
  tenLatin?: string; // Latin Name
  tenTA?: string; // English Name
  tenTV?: string; // Vietnamese Name
  bpnc?: string; // Research Part
  nguonKhac?: string; // Other Sources

  // Physical Properties (TCVL)
  trangThai: string; // State/Phase
  mau: string; // Color
  uvSklm: UVSKLMData;
  diemNongChay?: string; // Melting Point
  alphaD?: string; // Optical Rotation
  dungMoiHoaTanTCVL?: string; // Solvent for TCVL

  // Structure
  ctpt: string; // Molecular Formula
  klpt?: string; // Molecular Weight
  hinhCauTruc: string; // Structure Image (URL or Base64)
  cauHinhTuyetDoi: boolean; // Absolute Configuration

  // SMILES
  smiles?: string;

  // Spectra
  pho: SpectralRecord;

  // NMR Solvent
  dmNMRGeneral?: string; // General NMR Solvent

  // Computational Chemistry Data
  cartCoor?: string; // Cartesian Coordinates
  imgFreq?: string; // # of Imaginary Frequencies
  te?: string; // Total Energy

  // Single NMR Data Block (Format Trang 2)
  nmrData: NMRDataBlock[];
}


export const initialNMRSignalData: Omit<NMRSignalData, 'id'> = {
  viTri: '',
  scab: '',
  shacJHz: '',
};

export const initialNMRCondition: Omit<NMRCondition, 'id'> = {
  dmNMR: '',
  tanSo13C: '',
  tanSo1H: '',
};

export const initialNMRDataBlock: Omit<NMRDataBlock, 'id'> = {
  sttBang: '',
  nmrConditions: { ...initialNMRCondition, id: crypto.randomUUID() }, // << UPDATED: Was an array
  signals: [],
  luuYNMR: '',
  tltkNMR: '',
};

export const initialCompoundData: Omit<CompoundData, 'id' | 'nmrData'> & { nmrData: Omit<NMRDataBlock, 'id'>[] } = {
  sttRC: 0,
  tenHC: '',
  tenHCKhac: '',
  loaiHC: '', // << UPDATED
  status: '', // << UPDATED
  tenLatin: '',
  tenTA: '',
  tenTV: '',
  bpnc: '',
  nguonKhac: '',
  trangThai: '', // << UPDATED
  mau: '', // << UPDATED
  uvSklm: { nm254: false, nm365: false },
  diemNongChay: '',
  alphaD: '',
  dungMoiHoaTanTCVL: '',
  ctpt: '',
  klpt: '',
  hinhCauTruc: '',
  cauHinhTuyetDoi: false,
  smiles: '',
  pho: { // Initialize with empty arrays
    '1h': [], '13c': [], dept: [], hsqc: [],
    hmbc: [], cosy: [], noesy: [],
    roesy: [], hrms: [], lrms: [],
    ir: [], uv_pho: [], cd: []
  },
  dmNMRGeneral: '',
  cartCoor: '',
  imgFreq: '',
  te: '',
  nmrData: [{ ...initialNMRDataBlock }],
};
