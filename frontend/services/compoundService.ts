import { SPECTRAL_FIELDS } from '../constants'; // Import SPECTRAL_FIELDS
import { CompoundData, initialCompoundData, NMRDataBlock, initialNMRDataBlock, initialNMRCondition, initialNMRSignalData, CompoundStatus, UVSKLMData, SpectralRecord, NMRSignalData } from '../types';

// Use relative URL for API since nginx handles the routing
const API_BASE_URL = '/api';

// Helper to ensure data integrity for loaded compounds
const ensureCompoundDataIntegrity = (compound: Partial<CompoundData>): CompoundData => {
  const defaults = {
    ...initialCompoundData,
    id: compound.id || crypto.randomUUID(),
    nmrData: [{ ...initialNMRDataBlock, id: '' }],
  };

  const validatedPho: SpectralRecord = {};
  SPECTRAL_FIELDS.forEach(field => {
    const key = field.key;
    const existingValue = compound.pho?.[key as keyof SpectralRecord];
    if (Array.isArray(existingValue)) {
      validatedPho[key] = existingValue;
    } else if (typeof existingValue === 'string' && existingValue) {
      validatedPho[key] = [existingValue];
    } else {
      validatedPho[key] = [];
    }
  });

  // Normalize nmrData to array
  let nmrDataBlocks: NMRDataBlock[] = [];
  if (Array.isArray(compound.nmrData)) {
    nmrDataBlocks = (compound.nmrData as Partial<NMRDataBlock>[]).map((block: Partial<NMRDataBlock>): NMRDataBlock => ({
      ...initialNMRDataBlock,
      ...block,
      id: block.id || crypto.randomUUID(),
      nmrConditions: {
        ...initialNMRCondition,
        ...(block.nmrConditions || {}),
        id: (block.nmrConditions && block.nmrConditions.id) ? block.nmrConditions.id : crypto.randomUUID(),
      },
      signals: (block.signals || []).map((sig: Partial<NMRSignalData>): NMRSignalData => ({ ...initialNMRSignalData, ...sig, id: sig.id || crypto.randomUUID() })),
    }));
  } else if (compound.nmrData && typeof compound.nmrData === 'object') {
    // Legacy: single block
    const block = compound.nmrData as Partial<NMRDataBlock>;
    nmrDataBlocks = [{
      ...initialNMRDataBlock,
      ...block,
      id: block.id || crypto.randomUUID(),
      nmrConditions: {
        ...initialNMRCondition,
        ...(block.nmrConditions || {}),
        id: (block.nmrConditions && block.nmrConditions.id) ? block.nmrConditions.id : crypto.randomUUID(),
      },
      signals: (block.signals || []).map((sig: Partial<NMRSignalData>): NMRSignalData => ({ ...initialNMRSignalData, ...sig, id: sig.id || crypto.randomUUID() })),
    }];
  } else {
    nmrDataBlocks = [{ ...initialNMRDataBlock, id: crypto.randomUUID() }];
  }

  const validatedCompound: CompoundData = {
    ...defaults,
    ...compound,
    sttRC: typeof compound.sttRC === 'number' ? compound.sttRC : (parseInt(String(compound.sttRC), 10) || 0),
    hinhCauTruc: compound.hinhCauTruc || '',
    status: compound.status || CompoundStatus.NEW,
    uvSklm: {
      nm254: typeof compound.uvSklm?.nm254 === 'boolean' ? compound.uvSklm.nm254 : false,
      nm365: typeof compound.uvSklm?.nm365 === 'boolean' ? compound.uvSklm.nm365 : false,
    } as UVSKLMData,
    cauHinhTuyetDoi: typeof compound.cauHinhTuyetDoi === 'boolean' ? compound.cauHinhTuyetDoi : false,
    pho: validatedPho,
    nmrData: nmrDataBlocks,
  };
  return validatedCompound;
};

// API helper function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  // If no content (like 204 No Content) or empty response, return null
  if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
    return null;
  }

  return response.json();
};

// Public function to get paginated and filtered compounds
export const getCompounds = async (options: { page: number; limit: number; searchTerm?: string; loaiHC?: string[]; status?: string[]; trangThai?: string[]; mau?: string[] }): Promise<{ data: CompoundData[]; pagination: { totalItems: number; totalPages: number; currentPage: number; limit: number; } }> => {
  try {
    const { page, limit, searchTerm = '', loaiHC = [], status = [], trangThai = [], mau = [] } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(searchTerm && { searchTerm }),
    });
    // Add filters as repeated params for arrays
    loaiHC.forEach(val => params.append('loaiHC', val));
    status.forEach(val => params.append('status', val));
    trangThai.forEach(val => params.append('trangThai', val));
    mau.forEach(val => params.append('mau', val));
    const url = `/compounds?${params}`;
    const response = await apiRequest(url);

    if (response.success) {
      return {
        data: response.data.map((compound: Partial<CompoundData>) => ensureCompoundDataIntegrity(compound)),
        pagination: response.pagination,
      };
    } else {
      throw new Error(response.error || 'Failed to fetch compounds');
    }
  } catch (error) {
    console.error('Error fetching compounds:', error);
    throw error;
  }
};

export const getCompoundById = async (id: string): Promise<CompoundData | undefined> => {
  try {
    const response = await apiRequest(`/compounds/${id}`);

    if (response.success) {
      return ensureCompoundDataIntegrity(response.data);
    } else {
      throw new Error(response.error || 'Failed to fetch compound');
    }
  } catch (error) {
    console.error('Error fetching compound by ID:', error);
    throw error;
  }
};

// In saveCompound, remove legacy single-block logic and always send nmrData as array
export const saveCompound = async (compoundToSave: CompoundData): Promise<CompoundData> => {
  try {
    const validatedDataToSave = ensureCompoundDataIntegrity({
      ...compoundToSave,
      nmrData: (compoundToSave.nmrData || []).map(block => ({
        ...block,
        id: block.id || crypto.randomUUID(),
        nmrConditions: {
          ...(block.nmrConditions || initialNMRCondition),
          id: (block.nmrConditions && block.nmrConditions.id) ? block.nmrConditions.id : crypto.randomUUID(),
        },
        signals: (block.signals || []).map(s => ({ ...s, id: s.id || crypto.randomUUID() })),
      })),
    });

    let response;
    const isExistingCompound = validatedDataToSave.id &&
      validatedDataToSave.id !== '' &&
      validatedDataToSave.id !== '0' &&
      validatedDataToSave.id !== 'undefined' &&
      validatedDataToSave.id !== 'null';

    if (isExistingCompound) {
      response = await apiRequest(`/compounds/${validatedDataToSave.id}`, {
        method: 'PUT',
        body: JSON.stringify(validatedDataToSave),
      });
    } else {
      const dataForCreation = {
        ...validatedDataToSave,
        id: undefined,
        nmrData: validatedDataToSave.nmrData.map(block => ({
          ...block,
          id: undefined,
          sttBang: undefined,
          signals: (block.signals || []).map(signal => ({ ...signal, id: undefined }))
        }))
      };
      response = await apiRequest('/compounds', {
        method: 'POST',
        body: JSON.stringify(dataForCreation),
      });
    }

    if (response.success) {
      return ensureCompoundDataIntegrity(response.data);
    } else {
      throw new Error(response.error || 'Failed to save compound');
    }
  } catch (error) {
    console.error('Error saving compound:', error);
    throw error;
  }
};

export const deleteCompound = async (id: string): Promise<boolean> => {
  try {
    const response = await apiRequest(`/compounds/${id}`, {
      method: 'DELETE',
    });

    // For delete operations, a successful response might be null (204 No Content)
    // or contain a success message
    if (response === null || (response && response.success)) {
      return true;
    }

    throw new Error(response?.error || 'Failed to delete compound');
  } catch (error) {
    console.error('Error deleting compound:', error);
    throw error;
  }
};

// Upload a file to the backend and return the file URL
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error('File upload failed: ' + (data?.error || response.status));
    }
    return data.data?.url || data.data?.path;
  } catch (err) {
    console.error('[uploadFile] Upload error:', err);
    throw err;
  }
}

// Upload multiple files to the backend and return file info array
export async function uploadMultipleFiles(files: File[]): Promise<Array<{id: string; name: string; url: string; size: number; type: string}>> {
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
    return data.data.map((fileData: { originalName: string; url: string; size: number; mimetype: string }) => ({
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

// Utility functions to get unique values for dropdowns
export const getUniqueLoaiHCValues = async (): Promise<string[]> => {
  try {
    const response = await apiRequest('/meta/loai-hc');

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch loaiHC values');
    }
  } catch (error) {
    console.error('Error fetching unique loaiHC values:', error);
    throw error;
  }
};

export const getUniqueTrangThaiValues = async (): Promise<string[]> => {
  try {
    const response = await apiRequest('/meta/trang-thai');

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch trangThai values');
    }
  } catch (error) {
    console.error('Error fetching unique trangThai values:', error);
    throw error;
  }
};

export const getUniqueMauValues = async (): Promise<string[]> => {
  try {
    const response = await apiRequest('/meta/mau');

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch mau values');
    }
  } catch (error) {
    console.error('Error fetching unique mau values:', error);
    throw error;
  }
};

export const getUniqueNmrSolventValues = async (): Promise<string[]> => {
  try {
    const response = await apiRequest('/meta/nmr-solvent');

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch NMR solvent values');
    }
  } catch (error) {
    console.error('Error fetching unique NMR solvent values:', error);
    throw error;
  }
};

export const getNextsttRC = async (): Promise<number> => {
  try {
    const response = await apiRequest('/compounds/next-stt-rc');

    if (response.success) {
      return response.data.nextsttRC;
    } else {
      throw new Error(response.error || 'Failed to fetch next sttRC');
    }
  } catch (error) {
    console.error('Error fetching next sttRC:', error);
    throw error;
  }
};

export const getNextSttBang = async (): Promise<number> => {
  try {
    const response = await apiRequest('/compounds/next-stt-bang');

    if (response.success) {
      return response.data.nextSttBang;
    } else {
      throw new Error(response.error || 'Failed to fetch next SttBang');
    }
  } catch (error) {
    console.error('Error fetching next SttBang:', error);
    throw error;
  }
};

// Delete a file from the backend
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error('File deletion failed: ' + (data?.error || response.status));
    }
  } catch (err) {
    console.error('[deleteFile] Deletion error:', err);
    throw err;
  }
}
