import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CompoundForm } from '../components/CompoundForm';
import { CompoundData } from '../types';
import { saveCompound } from '../services/compoundService';

export const AddCompoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: CompoundData): Promise<boolean> => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await saveCompound(data);
      console.log('Compound saved successfully! Navigating home...');
      requestAnimationFrame(() => {
        navigate('/');
      });
      return true;
    } catch (error) {
      console.error('Failed to save compound:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save compound');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('addCompoundPage.title')}</h1>
      <CompoundForm onSave={handleSave} saveError={saveError} isSaving={isSaving} />
    </div>
  );
};
