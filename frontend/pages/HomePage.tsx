import JSZip from 'jszip';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactSelect from 'react-select';
import { CompoundListItem } from '../components/CompoundListItem';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Pagination } from '../components/ui/Pagination';
import { DEFAULT_LOAI_HC_OPTIONS, DEFAULT_TRANG_THAI_OPTIONS, DEFAULT_MAU_OPTIONS, COMPOUND_STATUS_OPTIONS_KEYS } from '../constants';
import { getCompounds, deleteCompound, getUniqueLoaiHCValues, getUniqueTrangThaiValues, getUniqueMauValues } from '../services/compoundService';
import { exportCompoundToXlsx } from '../services/xlsxExportService';
import { CompoundData } from '../types';

const ITEMS_PER_PAGE = 10;

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [compounds, setCompounds] = useState<CompoundData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [compoundIdToDelete, setCompoundIdToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const wasFocusedRef = useRef(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Filter state
  const [loaiHCOptions, setLoaiHCOptions] = useState<string[]>(DEFAULT_LOAI_HC_OPTIONS);
  const [trangThaiOptions, setTrangThaiOptions] = useState<string[]>(DEFAULT_TRANG_THAI_OPTIONS);
  const [mauOptions, setMauOptions] = useState<string[]>(DEFAULT_MAU_OPTIONS);

  const [selectedLoaiHC, setSelectedLoaiHC] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedTrangThai, setSelectedTrangThai] = useState<string[]>([]);
  const [selectedMau, setSelectedMau] = useState<string[]>([]);

  // Status options (static, from constants)
  const statusOptions = COMPOUND_STATUS_OPTIONS_KEYS.map(opt => ({ value: opt.value, label: t(opt.labelKey) }));

  // Fetch filter options on mount (merge with defaults, dedupe)
  useEffect(() => {
    getUniqueLoaiHCValues().then(values => setLoaiHCOptions(Array.from(new Set([...DEFAULT_LOAI_HC_OPTIONS, ...values])))).catch(() => setLoaiHCOptions(DEFAULT_LOAI_HC_OPTIONS));
    getUniqueTrangThaiValues().then(values => setTrangThaiOptions(Array.from(new Set([...DEFAULT_TRANG_THAI_OPTIONS, ...values])))).catch(() => setTrangThaiOptions(DEFAULT_TRANG_THAI_OPTIONS));
    getUniqueMauValues().then(values => setMauOptions(Array.from(new Set([...DEFAULT_MAU_OPTIONS, ...values])))).catch(() => setMauOptions(DEFAULT_MAU_OPTIONS));
  }, []);

  // Update fetchCompounds to use filters and auto-apply on change
  const fetchCompounds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, pagination } = await getCompounds({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        searchTerm: debouncedSearchTerm,
        loaiHC: selectedLoaiHC,
        status: selectedStatus,
        trangThai: selectedTrangThai,
        mau: selectedMau,
      });
      setCompounds(data);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.totalItems);
    } catch (err) {
      console.error('Error fetching compounds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch compounds');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedLoaiHC, selectedStatus, selectedTrangThai, selectedMau]);

  // Effect 1: Reset page to 1 if any filter changes
  const prevFiltersRef = useRef({ selectedLoaiHC, selectedStatus, selectedTrangThai, selectedMau, debouncedSearchTerm });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged =
      prev.selectedLoaiHC !== selectedLoaiHC ||
      prev.selectedStatus !== selectedStatus ||
      prev.selectedTrangThai !== selectedTrangThai ||
      prev.selectedMau !== selectedMau ||
      prev.debouncedSearchTerm !== debouncedSearchTerm;

    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
    }
    prevFiltersRef.current = { selectedLoaiHC, selectedStatus, selectedTrangThai, selectedMau, debouncedSearchTerm };
  }, [selectedLoaiHC, selectedStatus, selectedTrangThai, selectedMau, debouncedSearchTerm, currentPage]);

  // Effect 2: Fetch compounds when page or filters change
  useEffect(() => {
    fetchCompounds();
  }, [currentPage, selectedLoaiHC, selectedStatus, selectedTrangThai, selectedMau, debouncedSearchTerm, fetchCompounds]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Maintain focus after re-renders
  useEffect(() => {
    if (wasFocusedRef.current && searchInputRef.current) {
      searchInputRef.current.focus();
      // Restore cursor position to end of input
      const length = searchInputRef.current.value.length;
      searchInputRef.current.setSelectionRange(length, length);
    }
  });

  const handleSearchFocus = () => {
    wasFocusedRef.current = true;
  };

  const handleSearchBlur = () => {
    wasFocusedRef.current = false;
  };

  const openDeleteConfirmModal = (id: string) => {
    setCompoundIdToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!compoundIdToDelete) return;

    try {
      await deleteCompound(compoundIdToDelete);
      // Remove the deleted compound from selectedIds
      setSelectedIds(prev => prev.filter(id => id !== compoundIdToDelete));
      // After deleting, refetch. If the last item on a page is deleted, we might need to go to the previous page.
      if (compounds.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchCompounds();
      }
    } catch (err) {
      console.error('Error deleting compound:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete compound');
    }
    setCompoundIdToDelete(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const startItem = totalItems > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const handleSelectChange = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const handleBulkExport = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const usedFilenames = new Set<string>();

      // Fetch full data for each selected compound
      for (const id of selectedIds) {
        const compound = compounds.find(c => c.id === id);
        if (!compound) continue;
        // Generate Excel file as Blob
        const buffer = await exportCompoundToXlsx(compound, { returnBuffer: true });
        if (buffer) {
          // Use codeHC for filename if available, otherwise fallback to sttRC, then compound.id
          const filenameIdentifier = compound.codeHC || compound.sttRC || compound.id;
          let filename = `${filenameIdentifier}.xlsx`;

          // Handle duplicate filenames by adding a counter suffix
          let counter = 1;
          while (usedFilenames.has(filename)) {
            filename = `${filenameIdentifier}_${counter}.xlsx`;
            counter++;
          }

          usedFilenames.add(filename);
          zip.file(filename, buffer);
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'compounds_bulk_export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert('Bulk export failed. See console for details.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && compounds.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">{t('compoundListPage.title')}</h1>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
            <input
                ref={searchInputRef}
                type="text"
                placeholder={t('compoundListPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
            />
        </div>
      </div>
      {/* Filter dropdowns */}
      <div className="mb-6">
        <div className="bg-white/80 border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-4">
          <div className="w-full sm:w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('compoundListPage.filter.type')}</label>
            <ReactSelect
              isMulti
              options={loaiHCOptions.map(opt => ({ value: opt, label: opt }))}
              value={loaiHCOptions.filter(opt => selectedLoaiHC.includes(opt)).map(opt => ({ value: opt, label: opt }))}
              onChange={vals => setSelectedLoaiHC(vals.map(v => v.value))}
              placeholder={t('compoundListPage.filter.type')}
              classNamePrefix="react-select"
              styles={{ container: base => ({ ...base, width: '100%' }), menu: base => ({ ...base, zIndex: 20 }) }}
            />
          </div>
          <div className="w-full sm:w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('compoundListPage.filter.status')}</label>
            <ReactSelect
              isMulti
              options={statusOptions}
              value={statusOptions.filter(opt => selectedStatus.includes(opt.value))}
              onChange={vals => setSelectedStatus(vals.map(v => v.value))}
              placeholder={t('compoundListPage.filter.status')}
              classNamePrefix="react-select"
              styles={{ container: base => ({ ...base, width: '100%' }), menu: base => ({ ...base, zIndex: 20 }) }}
            />
          </div>
          <div className="w-full sm:w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('compoundListPage.filter.state')}</label>
            <ReactSelect
              isMulti
              options={trangThaiOptions.map(opt => ({ value: opt, label: t(`compoundState.${opt}`, opt) }))}
              value={trangThaiOptions.filter(opt => selectedTrangThai.includes(opt)).map(opt => ({ value: opt, label: t(`compoundState.${opt}`, opt) }))}
              onChange={vals => setSelectedTrangThai(vals.map(v => v.value))}
              placeholder={t('compoundListPage.filter.state')}
              classNamePrefix="react-select"
              styles={{ container: base => ({ ...base, width: '100%' }), menu: base => ({ ...base, zIndex: 20 }) }}
            />
          </div>
          <div className="w-full sm:w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('compoundListPage.filter.color')}</label>
            <ReactSelect
              isMulti
              options={mauOptions.map(opt => ({ value: opt, label: t(`compoundColor.${opt}`, opt) }))}
              value={mauOptions.filter(opt => selectedMau.includes(opt)).map(opt => ({ value: opt, label: t(`compoundColor.${opt}`, opt) }))}
              onChange={vals => setSelectedMau(vals.map(v => v.value))}
              placeholder={t('compoundListPage.filter.color')}
              classNamePrefix="react-select"
              styles={{ container: base => ({ ...base, width: '100%' }), menu: base => ({ ...base, zIndex: 20 }) }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <span className="font-semibold">{t('bulkActions.selected', { count: selectedIds.length })}</span>
            <span className="ml-2 text-sm text-gray-700">{compounds.filter(c => selectedIds.includes(c.id)).map(c => c.tenHC).join(', ')}</span>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={handleBulkExport}
              disabled={isExporting}
            >
              {isExporting ? t('bulkActions.exporting') : t('bulkActions.bulkExport')}
            </button>
            <button
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              onClick={() => setSelectedIds([])}
              disabled={isExporting}
            >
              {t('bulkActions.clearAll')}
            </button>
          </div>
        </div>
      )}

      {/* Always render the content area to maintain consistent DOM structure */}
      <div className="min-h-[400px]">
        {compounds.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {t('pagination.showingResults', { start: startItem, end: endItem, total: totalItems })}
            </p>
            <div className="space-y-4">
              {compounds.map(compound => (
                <CompoundListItem
                  key={compound.id}
                  compound={compound}
                  onDelete={openDeleteConfirmModal}
                  selected={selectedIds.includes(compound.id)}
                  onSelectChange={handleSelectChange}
                />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-700">{t('compoundListPage.noCompoundsFound')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {debouncedSearchTerm ? t('compoundListPage.noCompoundsFoundWithSearch') : t('compoundListPage.noCompoundsFoundGeneral')}
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setCompoundIdToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('viewCompoundPage.deleteConfirmTitle')}
        message={t('viewCompoundPage.deleteConfirmMessage', { compoundName: compounds.find(c => c.id === compoundIdToDelete)?.tenHC || ''})}
      />
    </div>
  );
};

export default HomePage;
