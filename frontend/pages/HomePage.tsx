import JSZip from 'jszip';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CompoundListItem } from '../components/CompoundListItem';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Pagination } from '../components/ui/Pagination';
import { getCompounds, deleteCompound } from '../services/compoundService';
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

  const fetchCompounds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, pagination } = await getCompounds({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        searchTerm: debouncedSearchTerm
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
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchCompounds();
  }, [fetchCompounds]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page on new search
  }, [debouncedSearchTerm]);

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
      // Fetch full data for each selected compound
      for (const id of selectedIds) {
        const compound = compounds.find(c => c.id === id);
        if (!compound) continue;
        // Generate Excel file as Blob
        const buffer = await exportCompoundToXlsx(compound, { returnBuffer: true });
        if (buffer) {
          zip.file(`${compound.sttHC || compound.id}.xlsx`, buffer);
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
