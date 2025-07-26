import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CompoundView } from '../components/CompoundView';
import { NMRTableView } from '../components/NMRTableView';
import { TrashIcon } from '../components/icons/TrashIcon';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { getCompoundById, deleteCompound } from '../services/compoundService';
import { exportCompoundToXlsx } from '../services/xlsxExportService';
import { CompoundData } from '../types';

export const ViewCompoundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [compound, setCompound] = useState<CompoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchCompound = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const compoundData = await getCompoundById(id);
        if (compoundData) {
          setCompound(compoundData);
        } else {
          setError('Compound not found');
        }
      } catch (err) {
        console.error('Error fetching compound:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch compound');
      } finally {
        setLoading(false);
      }
    };

    fetchCompound();
  }, [id]);

  if (!id) {
    return <p className="text-center text-red-500 mt-10 text-xl">Compound ID is missing.</p>;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error || !compound) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center py-10">
          <p className="text-red-500 text-xl">{error || 'Compound not found'}</p>
          <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
            {t('buttons.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  const openDeleteConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCompound(compound.id);
      requestAnimationFrame(() => {
        navigate('/');
      });
    } catch (err) {
      console.error(`[ViewCompoundPage] Deletion failed for ID: ${compound.id}.`, err);
      setError(err instanceof Error ? err.message : 'Failed to delete compound');
    }
  };

  const handleBackToList = () => {
    navigate('/');
  };

  const handleExportToXlsx = async () => {
    if (!compound) return;
    setIsExporting(true);
    try {
      await exportCompoundToXlsx(compound);
    } catch (error) {
      console.error("Error exporting to XLSX:", error);
      alert("Failed to export to XLSX. See console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  const nmrDataContentExists = Array.isArray(compound.nmrData) && compound.nmrData.some(block =>
    (block.signals && block.signals.length > 0) ||
    (block.luuYNMR && block.luuYNMR.trim() !== '') ||
    (block.tltkNMR && block.tltkNMR.trim() !== '') ||
    (block.nmrConditions && (
      (block.nmrConditions.dmNMR && block.nmrConditions.dmNMR.trim() !== '') ||
      (block.nmrConditions.tanSo1H && block.nmrConditions.tanSo1H.trim() !== '') ||
      (block.nmrConditions.tanSo13C && block.nmrConditions.tanSo13C.trim() !== '')
    ))
  );

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 break-all">{compound.tenHC}</h1>

        {/* Main action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleBackToList}
            className="!bg-indigo-500 !hover:bg-indigo-600 !text-white !border-indigo-500"
            size="sm"
          >
            {t('buttons.backToList')}
          </Button>
          <Link to={`/edit/${compound.id}`}>
            <Button
              className="!bg-blue-500 !hover:bg-blue-600 !text-white !border-blue-500"
              size="sm"
            >
              {t('buttons.edit')}
            </Button>
          </Link>
          <Button
            onClick={handleExportToXlsx}
            disabled={isExporting}
            className="!bg-green-500 !hover:bg-green-600 !text-white !border-green-500 disabled:!opacity-50"
            size="sm"
          >
            {isExporting ? t('buttons.exporting') : t('buttons.exportToXlsx')}
          </Button>
        </div>

        {/* Delete button - positioned far away */}
        <div className="flex justify-start sm:justify-end pt-2 border-t border-gray-200">
          <Button
            size="sm"
            onClick={openDeleteConfirmModal}
            leftIcon={<TrashIcon className="w-4 h-4"/>}
            className="!bg-red-500 !hover:bg-red-600 !text-white !border-red-500"
          >
            {t('buttons.delete')}
          </Button>
        </div>
      </div>

      <CompoundView compound={compound} />

      {nmrDataContentExists && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-t pt-6">{t('compoundForm.nmrData.title')}</h2>
          <NMRTableView nmrDataBlocks={compound.nmrData} compoundsttRC={String(compound.sttRC)} />
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
        }}
        onConfirm={handleConfirmDelete}
        title={t('viewCompoundPage.deleteConfirmTitle')}
        message={t('viewCompoundPage.deleteConfirmMessage', { compoundName: compound.tenHC })}
      />
    </div>
  );
};

export default ViewCompoundPage;
