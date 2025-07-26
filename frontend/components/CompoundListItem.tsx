import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CompoundData } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { Button } from './ui/Button';

interface CompoundListItemProps {
  compound: CompoundData;
  onDelete: (id: string) => void;
  selected?: boolean;
  onSelectChange?: (id: string, checked: boolean) => void;
}

export const CompoundListItem: React.FC<CompoundListItemProps> = ({ compound, onDelete, selected = false, onSelectChange }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div className="flex items-center gap-2">
        {onSelectChange && (
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelectChange(compound.id, e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600"
          />
        )}
        <Link to={`/view/${compound.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
          <h3 className="text-lg font-semibold">{compound.tenHC} ({t('compoundListItem.sttRCPrefix')}{compound.sttRC})</h3>
        </Link>
      </div>
      <div>
        <p className="text-sm text-gray-600">{t('compoundListItem.typePrefix')}{compound.loaiHC}</p>
        {compound.tenLatin && <p className="text-xs text-gray-500">{t('compoundListItem.latinPrefix')}{compound.tenLatin}</p>}
      </div>
      <div className="mt-3 sm:mt-0 flex space-x-2">
        <Link to={`/edit/${compound.id}`} className="h-8">
            <Button variant="secondary" size="sm" className="h-8">{t('buttons.edit')}</Button>
        </Link>
        <Button
            variant="danger"
            size="sm"
            className="h-8"
            onClick={(e) => { e.stopPropagation(); onDelete(compound.id); }}
            leftIcon={<TrashIcon className="w-4 h-4"/>}
        >
            {t('buttons.delete')}
        </Button>
      </div>
    </div>
  );
};
