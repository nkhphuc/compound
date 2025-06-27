import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCompoundById, deleteCompound } from '../services/compoundService';
import { CompoundView } from '../components/CompoundView';
import { NMRTableView } from '../components/NMRTableView';
import { Button } from '../components/ui/Button';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { exportCompoundToXlsx } from '../services/xlsxExportService'; // Import the new XLSX service

export const ViewCompoundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const compound = id ? getCompoundById(id) : undefined;

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!id) {
    return <p className="text-center text-red-500 mt-10 text-xl">Compound ID is missing.</p>;
  }
  if (!compound) {
    return <p className="text-center text-red-500 mt-10 text-xl">Compound not found for ID: {id}.</p>;
  }

  const openDeleteConfirmModal = () => {
    console.log(`[ViewCompoundPage] openDeleteConfirmModal called for ID: ${compound.id}`);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log(`[ViewCompoundPage] User confirmed deletion for ID: ${compound.id} via custom modal.`);
    const success = deleteCompound(compound.id);
    if (success) {
        console.log(`[ViewCompoundPage] Deletion successful for ID: ${compound.id}. Navigating home...`);
        requestAnimationFrame(() => {
          navigate('/');
        });
    } else {
        console.error(`[ViewCompoundPage] Deletion failed for ID: ${compound.id}.`);
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

  const nmrDataContentExists = compound.nmrData && (
    (compound.nmrData.signals && compound.nmrData.signals.length > 0) ||
    (compound.nmrData.luuYNMR && compound.nmrData.luuYNMR.trim() !== '') ||
    (compound.nmrData.tltkNMR && compound.nmrData.tltkNMR.trim() !== '') ||
    (compound.nmrData.nmrConditions && ( // Check single condition object
        (compound.nmrData.nmrConditions.dmNMR && compound.nmrData.nmrConditions.dmNMR.trim() !== '') ||
        (compound.nmrData.nmrConditions.tanSo1H && compound.nmrData.nmrConditions.tanSo1H.trim() !== '') ||
        (compound.nmrData.nmrConditions.tanSo13C && compound.nmrData.nmrConditions.tanSo13C.trim() !== '')
    ))
  );

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 break-all">{compound.tenHC}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          <Button variant="ghost" onClick={handleBackToList} className="text-indigo-600 hover:bg-indigo-50">
            {t('buttons.backToList')}
          </Button>
          <Link to={`/edit/${compound.id}`}>
            <Button variant="secondary" size="sm">{t('buttons.edit')}</Button>
          </Link>
          <Button
            variant="ghost"
            onClick={handleExportToXlsx}
            disabled={isExporting}
            className="text-green-600 hover:bg-green-50"
            size="sm"
          >
            {isExporting ? t('buttons.exporting') : t('buttons.exportToXlsx')}
          </Button>
          <Button variant="danger" size="sm" onClick={openDeleteConfirmModal} leftIcon={<TrashIcon className="w-4 h-4"/>}>
            {t('buttons.delete')}
          </Button>
        </div>
      </div>

      <CompoundView compound={compound} />

      {nmrDataContentExists && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-t pt-6">{t('compoundForm.nmrData.title')}</h2>
          <NMRTableView nmrDataBlock={compound.nmrData!} compoundSttHC={String(compound.sttHC)} />
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          console.log("[ViewCompoundPage] Custom confirm modal closed by user.");
        }}
        onConfirm={handleConfirmDelete}
        title={t('viewCompoundPage.deleteConfirmTitle')}
        message={t('viewCompoundPage.deleteConfirmMessage', { compoundName: compound.tenHC })}
      />
    </div>
  );
};
