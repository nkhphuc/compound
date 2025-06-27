
import { CompoundData, initialCompoundData, NMRDataBlock, initialNMRDataBlock, initialNMRCondition, initialNMRSignalData, CompoundStatus, UVSKLMData, SpectralRecord, NMRCondition } from '../types';
import { SPECTRAL_FIELDS } from '../constants'; // Import SPECTRAL_FIELDS

const COMPOUNDS_STORAGE_KEY = 'compoundsData';

// Helper to ensure data integrity for loaded compounds
const ensureCompoundDataIntegrity = (compound: Partial<CompoundData>): CompoundData => {
  const defaults = {
    ...initialCompoundData,
    id: compound.id || crypto.randomUUID(), // Ensure ID
    nmrData: { 
      ...initialNMRDataBlock, 
      id: `${compound.id || crypto.randomUUID()}-nmr`,
      ...(compound.nmrData || {}),
    }
  };

  const validatedPho: SpectralRecord = {};
  SPECTRAL_FIELDS.forEach(field => {
      const key = field.key;
      const existingValue = compound.pho?.[key as any]; 
      validatedPho[key] = typeof existingValue === 'string' ? existingValue : '';
  });

  let finalNmrConditions: NMRCondition;
  const rawNmrConditions = compound.nmrData?.nmrConditions;

  if (Array.isArray(rawNmrConditions) && rawNmrConditions.length > 0) {
    // Old format: array of conditions, take the first one
    finalNmrConditions = { ...initialNMRCondition, ...rawNmrConditions[0], id: rawNmrConditions[0].id || crypto.randomUUID() };
  } else if (typeof rawNmrConditions === 'object' && rawNmrConditions !== null && !Array.isArray(rawNmrConditions)) {
    // New format or already migrated: single object
    finalNmrConditions = { ...initialNMRCondition, ...(rawNmrConditions as NMRCondition), id: (rawNmrConditions as NMRCondition).id || crypto.randomUUID() };
  } else {
    // Default single condition if none provided or invalid format
    finalNmrConditions = { ...initialNMRCondition, id: crypto.randomUUID() };
  }


  const validatedCompound: CompoundData = {
    ...defaults,
    ...compound,
    sttHC: typeof compound.sttHC === 'number' ? compound.sttHC : (parseInt(String(compound.sttHC), 10) || 0),
    hinhCauTruc: compound.hinhCauTruc || '', 
    status: compound.status || CompoundStatus.NEW,
    uvSklm: { 
        nm254: typeof compound.uvSklm?.nm254 === 'boolean' ? compound.uvSklm.nm254 : false,
        nm365: typeof compound.uvSklm?.nm365 === 'boolean' ? compound.uvSklm.nm365 : false,
    } as UVSKLMData,
    cauHinhTuyetDoi: typeof compound.cauHinhTuyetDoi === 'boolean' ? compound.cauHinhTuyetDoi : false,
    pho: validatedPho,
    nmrData: {
      ...defaults.nmrData,
      id: defaults.nmrData.id || `${compound.id || crypto.randomUUID()}-nmr`, // Ensure nmrData.id
      sttBang: (typeof compound.nmrData?.sttBang === 'string' && compound.nmrData.sttBang.trim() !== '') ? compound.nmrData.sttBang : "", 
      nmrConditions: finalNmrConditions, // Use the processed single condition object
      signals: (compound.nmrData?.signals || []).map(sig => ({ ...initialNMRSignalData, ...sig, id: sig.id || crypto.randomUUID() })),
    } as NMRDataBlock,
  };
  return validatedCompound;
};

// Internal function to get all compounds from storage
const getAllCompounds = (): CompoundData[] => {
  try {
    const data = localStorage.getItem(COMPOUNDS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsedData = JSON.parse(data) as Partial<CompoundData>[];
    return parsedData.map(ensureCompoundDataIntegrity);
  } catch (error) {
    console.error("Error loading compounds from localStorage:", error);
    return [];
  }
};


// Public function to get paginated and filtered compounds
export const getCompounds = (options: { page: number; limit: number; searchTerm?: string }): { data: CompoundData[]; pagination: { totalItems: number; totalPages: number; currentPage: number; limit: number; } } => {
  const { page, limit, searchTerm = '' } = options;
  const allCompounds = getAllCompounds();

  const filteredCompounds = searchTerm
    ? allCompounds.filter(compound =>
        compound.tenHC.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (compound.sttHC && String(compound.sttHC).toLowerCase().includes(searchTerm.toLowerCase())) ||
        (compound.loaiHC && compound.loaiHC.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : allCompounds;

  const totalItems = filteredCompounds.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = filteredCompounds.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
    },
  };
};

export const getNextSttHC = (): number => {
  const compounds = getAllCompounds();
  if (compounds.length === 0) {
    return 1;
  }
  const maxSttHC = Math.max(...compounds.map(c => Number(c.sttHC) || 0));
  return maxSttHC + 1;
};

export const saveCompound = (compoundToSave: CompoundData): boolean => {
  try {
    const compounds = getAllCompounds();
    let compoundExists = false;

    let finalSttHC = compoundToSave.sttHC;
    if (finalSttHC === 0) { 
      finalSttHC = getNextSttHC();
    }

    let finalNmrSttBang = compoundToSave.nmrData.sttBang;
    if (finalNmrSttBang === "") { 
        finalNmrSttBang = "1"; 
    }
    
    const validatedDataToSave = ensureCompoundDataIntegrity({
        ...compoundToSave,
        sttHC: finalSttHC,
        nmrData: {
            ...compoundToSave.nmrData,
            sttBang: finalNmrSttBang,
            id: compoundToSave.nmrData.id || `${compoundToSave.id}-nmr`,
            // nmrConditions will be handled by ensureCompoundDataIntegrity
        }
    });


    const updatedCompounds = compounds.map(c => {
      if (c.id === validatedDataToSave.id) {
        compoundExists = true;
        return validatedDataToSave;
      }
      return c;
    });

    if (!compoundExists) {
      updatedCompounds.push(validatedDataToSave);
    }

    localStorage.setItem(COMPOUNDS_STORAGE_KEY, JSON.stringify(updatedCompounds));
    return true;
  } catch (error) {
    console.error("Error saving compound to localStorage:", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Failed to save data: LocalStorage is full. Please free up some space or contact support.');
    } else {
      alert('An unexpected error occurred while saving. Please try again.');
    }
    return false;
  }
};

export const getCompoundById = (id: string): CompoundData | undefined => {
  const compounds = getAllCompounds();
  return compounds.find(compound => compound.id === id);
};

export const deleteCompound = (id: string): boolean => {
  try {
    const compounds = getAllCompounds();
    const updatedCompounds = compounds.filter(compound => compound.id !== id);
    localStorage.setItem(COMPOUNDS_STORAGE_KEY, JSON.stringify(updatedCompounds));
    return true;
  } catch (error) {
    console.error("Error deleting compound from localStorage:", error);
    return false;
  }
};


// Utility functions to get unique values for dropdowns
export const getUniqueLoaiHCValues = (): string[] => {
  const compounds = getAllCompounds();
  const uniqueValues = new Set(compounds.map(c => c.loaiHC).filter(Boolean));
  return Array.from(uniqueValues);
};

export const getUniqueTrangThaiValues = (): string[] => {
  const compounds = getAllCompounds();
  const uniqueValues = new Set(compounds.map(c => c.trangThai).filter(Boolean));
  return Array.from(uniqueValues);
};

export const getUniqueMauValues = (): string[] => {
  const compounds = getAllCompounds();
  const uniqueValues = new Set(compounds.map(c => c.mau).filter(Boolean));
  return Array.from(uniqueValues);
};