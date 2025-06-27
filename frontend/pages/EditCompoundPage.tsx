import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CompoundForm } from '../components/CompoundForm';
import { CompoundData } from '../types';
import { getCompoundById, saveCompound } from '../services/compoundService';

export const EditCompoundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [compoundToEdit, setCompoundToEdit] = useState<CompoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCompound = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const compoundData = await getCompoundById(id);
        if (compoundData) {
          setCompoundToEdit(compoundData);
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

  const handleSave = async (data: CompoundData): Promise<boolean> => {
    if (!id) return false;

    try {
      setIsSaving(true);
      setSaveError(null);
      await saveCompound({ ...data, id }); // Ensure ID is preserved
      requestAnimationFrame(() => {
        navigate(`/view/${id}`);
      });
      return true;
    } catch (error) {
      console.error('Failed to update compound:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update compound');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

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

  if (error || !compoundToEdit) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center py-10">
          <p className="text-red-500 text-xl">{error || 'Compound not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('editCompoundPage.title', { compoundName: compoundToEdit.tenHC })}</h1>
      <CompoundForm initialData={compoundToEdit} onSave={handleSave} saveError={saveError} isSaving={isSaving} />
    </div>
  );
};
