import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CompoundData } from '../types';
import { Button } from './ui/Button';
import { TrashIcon } from './icons/TrashIcon';

interface CompoundListItemProps {
  compound: CompoundData;
  onDelete: (id: string) => void;
}

export const CompoundListItem: React.FC<CompoundListItemProps> = ({ compound, onDelete }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <Link to={`/view/${compound.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
          <h3 className="text-lg font-semibold">{compound.tenHC} ({t('compoundListItem.sttHcPrefix')}{compound.sttHC})</h3>
        </Link>
        <p className="text-sm text-gray-600">{t('compoundListItem.typePrefix')}{compound.loaiHC}</p>
        {compound.tenLatin && <p className="text-xs text-gray-500">{t('compoundListItem.latinPrefix')}{compound.tenLatin}</p>}
      </div>
      <div className="mt-3 sm:mt-0 flex space-x-2">
        <Link to={`/edit/${compound.id}`}>
            <Button variant="secondary" size="sm">{t('buttons.edit')}</Button>
        </Link>
        <Button 
            variant="danger" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onDelete(compound.id); }}
            leftIcon={<TrashIcon className="w-4 h-4"/>}
        >
            {t('buttons.delete')}
        </Button>
      </div>
    </div>
  );
};
