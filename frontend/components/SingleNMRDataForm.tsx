import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { NMRDataBlock, NMRSignalData, NMRCondition, initialNMRCondition } from '../types';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { NMRSignalForm } from './NMRSignalForm';
import { NMRSignalCSVInput } from './NMRSignalCSVInput';
import { PlusIcon } from './icons/PlusIcon';
// TrashIcon is no longer needed for conditions

interface SingleNMRDataFormProps {
  nmrDataBlock: NMRDataBlock;
  onFieldChange: (field: keyof Omit<NMRDataBlock, 'signals' | 'id' | 'nmrConditions'>, value: string) => void;

  onConditionChange: (field: keyof Omit<NMRCondition, 'id'>, value: string) => void; // UPDATED: no index
  // onAddCondition and onRemoveCondition are removed

  onSignalChange: (signalIndex: number, field: keyof Omit<NMRSignalData, 'id'>, value: string) => void;
  onAddSignal: () => void;
  onAddSignalsBulk: (signals: NMRSignalData[]) => void;
  onRemoveSignal: (signalIndex: number) => void;
  onReplaceSignals: (signals: NMRSignalData[]) => void;
}

export const SingleNMRDataForm: React.FC<SingleNMRDataFormProps> = ({
  nmrDataBlock,
  onFieldChange,
  onConditionChange,
  onSignalChange,
  onAddSignal,
  onAddSignalsBulk,
  onRemoveSignal,
  onReplaceSignals,
}) => {
  const { t } = useTranslation();
  const [showCSVInput, setShowCSVInput] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onFieldChange(name as keyof Omit<NMRDataBlock, 'signals' | 'id' | 'nmrConditions'>, value);
  };

  const handleConditionFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onConditionChange(name as keyof Omit<NMRCondition, 'id'>, value);
  };

  const handleAddSignalsFromCSV = (signals: NMRSignalData[]) => {
    // Use the bulk add function to add all signals at once
    onAddSignalsBulk(signals);
    setShowCSVInput(false);
  };

  const handleReplaceSignalsFromCSV = (signals: NMRSignalData[]) => {
    // Replace all existing signals with the new ones
    onReplaceSignals(signals);
    setShowCSVInput(false);
  };

  const sttBangDisplayValue = nmrDataBlock.sttBang === "" ? "" : nmrDataBlock.sttBang;
  const sttBangPlaceholder = nmrDataBlock.sttBang === "" ? t('nmrForm.tableIdPlaceholder') : undefined;

  // Ensure nmrConditions exists, providing a fallback if somehow undefined.
  // This should ideally be guaranteed by the parent component and data service.
  const currentCondition = nmrDataBlock.nmrConditions || { ...initialNMRCondition, id: crypto.randomUUID() };

  return (
    <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/30">
      <Input
        label={t('nmrForm.tableId')}
        name="sttBang"
        value={sttBangDisplayValue}
        placeholder={sttBangPlaceholder}
        readOnly
        className="bg-gray-100 cursor-not-allowed"
      />

      <div className="mt-4 pt-3 border-t border-indigo-200">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-md font-medium text-gray-700">{t('nmrForm.spectralDataTable')}</h5>
          <div className="flex space-x-2">
            <Button
              variant={showCSVInput ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setShowCSVInput(false)}
            >
              {t('nmrForm.inputMethod.rowByRow', 'Row by Row')}
            </Button>
            <Button
              variant={showCSVInput ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowCSVInput(true)}
            >
              {t('nmrForm.inputMethod.csvBulk', 'CSV Bulk')}
            </Button>
          </div>
        </div>

        {showCSVInput ? (
          <NMRSignalCSVInput
            onAddSignals={handleAddSignalsFromCSV}
            onReplaceSignals={handleReplaceSignalsFromCSV}
            onCancel={() => setShowCSVInput(false)}
            existingSignalsCount={nmrDataBlock.signals.length}
          />
        ) : (
          <>
            {nmrDataBlock.signals.map((signal, signalIndex) => (
              <NMRSignalForm
                key={signal.id}
                signal={signal}
                index={signalIndex}
                onSignalChange={(idx, field, val) => onSignalChange(idx, field as keyof Omit<NMRSignalData, 'id'>, val)}
                onRemoveSignal={onRemoveSignal}
              />
            ))}
            <Button variant="secondary" size="sm" onClick={onAddSignal} leftIcon={<PlusIcon className="w-4 h-4"/>}>
              {t('nmrForm.addSignal')}
            </Button>
          </>
        )}
      </div>

      <div className="mt-6 pt-3 border-t border-indigo-200">
        <h5 className="text-md font-medium text-gray-700 mb-2">{t('nmrForm.notesTitle')}</h5>

        {/* NMR Conditions part - simplified to a single set of fields */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start p-3 border border-gray-200 rounded-md mb-1 bg-slate-50 shadow-sm">
            <Input
              label={t('nmrForm.solvent')}
              name="dmNMR"
              value={currentCondition.dmNMR}
              onChange={handleConditionFieldChange}
              placeholder={t('nmrForm.solventPlaceholder')}
              wrapperClassName="mb-0"
            />
            <Input
              label={t('nmrForm.freq13c')}
              name="tanSo13C"
              value={currentCondition.tanSo13C}
              onChange={handleConditionFieldChange}
              placeholder={t('nmrForm.freq13cPlaceholder')}
              wrapperClassName="mb-0"
            />
            <Input
              label={t('nmrForm.freq1h')}
              name="tanSo1H"
              value={currentCondition.tanSo1H}
              onChange={handleConditionFieldChange}
              placeholder={t('nmrForm.freq1hPlaceholder')}
              wrapperClassName="mb-0"
            />
          </div>
          <p className="text-xs text-gray-500 px-1 mt-1">
            <Trans
              i18nKey="formulaHelpText"
              components={{
                code1: <code key="code1" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                code2: <code key="code2" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                code3: <code key="code3" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />,
                code4: <code key="code4" className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 font-mono" />
              }}
            />
          </p>
        </div>

        <Textarea
          label={t('nmrForm.generalNotes')} // This is the general notes field, distinct from NMR conditions
          name="luuYNMR"
          value={nmrDataBlock.luuYNMR}
          onChange={handleInputChange}
          rows={3}
          placeholder={t('nmrForm.generalNotesPlaceholder')}
          wrapperClassName="mt-4 pt-4 border-t border-dashed border-indigo-200"
        />
      </div>

      <div className="mt-6 pt-3 border-t border-indigo-200">
        <Textarea
          label={t('nmrForm.references')}
          name="tltkNMR"
          value={nmrDataBlock.tltkNMR}
          onChange={handleInputChange}
          rows={3}
          placeholder={t('nmrForm.referencesPlaceholder')}
        />
      </div>
    </div>
  );
};
