import React from 'react';
import { useTranslation } from 'react-i18next';
import { NMRSignalData } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { TrashIcon } from './icons/TrashIcon';

interface NMRSignalFormProps {
  signal: NMRSignalData;
  index: number;
  onSignalChange: (index: number, field: keyof NMRSignalData, value: string) => void;
  onRemoveSignal: (index: number) => void;
}

export const NMRSignalForm: React.FC<NMRSignalFormProps> = ({ signal, index, onSignalChange, onRemoveSignal }) => {
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onSignalChange(index, name as keyof NMRSignalData, value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-3 border border-gray-200 rounded-md mb-2 bg-slate-50">
      <Input
        label={t('nmrForm.position')}
        name="viTri"
        value={signal.viTri}
        onChange={handleChange}
        placeholder={t('nmrForm.positionPlaceholder')}
        wrapperClassName="mb-0"
      />
      <Input
        label={t('nmrForm.deltaC')}
        name="scab"
        value={signal.scab}
        onChange={handleChange}
        placeholder={t('nmrForm.deltaCPlaceholder')}
        wrapperClassName="mb-0"
      />
      <Input
        label={t('nmrForm.deltaH')}
        name="shacJHz"
        value={signal.shacJHz}
        onChange={handleChange}
        placeholder={t('nmrForm.deltaHPlaceholder')}
        wrapperClassName="mb-0"
      />
      <Button
        variant="danger"
        size="sm"
        onClick={() => onRemoveSignal(index)}
        className="self-center mb-0 md:mt-6"
        title={t('nmrForm.removeSignalTooltip')}
      >
        <TrashIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};