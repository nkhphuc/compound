import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CompoundForm } from '../components/CompoundForm';
import { CompoundData } from '../types';
import { getCompoundById, saveCompound } from '../services/compoundService';

export const EditCompoundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const compoundToEdit = id ? getCompoundById(id) : undefined;
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = (data: CompoundData): boolean => {
    if (!id) return false; 
    const success = saveCompound({ ...data, id }); // Ensure ID is preserved
    if (success) {
      console.log('Compound updated successfully! Navigating to view page...');
      setSaveError(null);
      requestAnimationFrame(() => {
        navigate(`/view/${id}`);
      });
      return true;
    } else {
      console.error('Failed to update compound.');
      setSaveError('Failed to update compound. LocalStorage might be full or disabled.');
      return false;
    }
  };

  if (!id) {
    return <p className="text-center text-red-500 mt-10 text-xl">Compound ID is missing.</p>;
  }
  if (!compoundToEdit) {
    return <p className="text-center text-red-500 mt-10 text-xl">Compound not found for ID: {id}.</p>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('editCompoundPage.title', { compoundName: compoundToEdit.tenHC })}</h1>
      <CompoundForm initialData={compoundToEdit} onSave={handleSave} saveError={saveError} />
    </div>
  );
};