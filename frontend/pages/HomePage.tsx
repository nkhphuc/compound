import React, { useState, useEffect, useCallback } from 'react';
import { CompoundData } from '../types';
import { getCompounds, deleteCompound } from '../services/compoundService';
import { CompoundListItem } from '../components/CompoundListItem';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Pagination } from '../components/ui/Pagination';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 10;

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [compounds, setCompounds] = useState<CompoundData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [compoundIdToDelete, setCompoundIdToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchCompounds = useCallback(() => {
    const { data, pagination } = getCompounds({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      searchTerm: searchTerm
    });
    setCompounds(data);
    setTotalPages(pagination.totalPages);
    setTotalItems(pagination.totalItems);
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchCompounds();
  }, [fetchCompounds]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page on new search
  }, [searchTerm]);

  const openDeleteConfirmModal = (id: string) => {
    setCompoundIdToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!compoundIdToDelete) return;
    const success = deleteCompound(compoundIdToDelete);
    if (success) {
      // After deleting, refetch. If the last item on a page is deleted, we might need to go to the previous page.
      if (compounds.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchCompounds();
      }
    }
    setCompoundIdToDelete(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const startItem = totalItems > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">{t('compoundListPage.title')}</h1>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
            <input
                type="text"
                placeholder={t('compoundListPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
            />
        </div>
      </div>

      {compounds.length > 0 ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {t('pagination.showingResults', { start: startItem, end: endItem, total: totalItems })}
          </p>
          <div className="space-y-4">
            {compounds.map(compound => (
              <CompoundListItem key={compound.id} compound={compound} onDelete={openDeleteConfirmModal} />
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
            {searchTerm ? t('compoundListPage.noCompoundsFoundWithSearch') : t('compoundListPage.noCompoundsFoundGeneral')}
          </p>
        </div>
      )}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setCompoundIdToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('viewCompoundPage.deleteConfirmTitle')} // Reusing title, consider specific if needed
        message={t('viewCompoundPage.deleteConfirmMessage', { compoundName: compounds.find(c => c.id === compoundIdToDelete)?.tenHC || ''})}
      />
    </div>
  );
};
