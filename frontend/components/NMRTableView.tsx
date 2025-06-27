import React from 'react';
import { useTranslation } from 'react-i18next';
import { NMRDataBlock, NMRCondition } from '../types'; // Updated import
import { ChemicalFormulaDisplay } from './ui/ChemicalFormulaDisplay';

interface NMRTableViewProps {
  nmrDataBlock: NMRDataBlock;
  compoundSttHC: string;
}

export const NMRTableView: React.FC<NMRTableViewProps> = ({ nmrDataBlock, compoundSttHC }) => {
  const { t } = useTranslation();
  
  if (!nmrDataBlock) return <p>{t('nmrView.noData')}</p>;

  const condition = nmrDataBlock.nmrConditions; // Now a single object
  const hasMeaningfulConditions = condition && (
                                   (condition.dmNMR && condition.dmNMR.trim() !== '') || 
                                   (condition.tanSo13C && condition.tanSo13C.trim() !== '') || 
                                   (condition.tanSo1H && condition.tanSo1H.trim() !== '')
                                 );

  const hasSignals = nmrDataBlock.signals && nmrDataBlock.signals.length > 0;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        {t('nmrView.title', { tableId: nmrDataBlock.sttBang || t('variousLabels.notAvailable', 'N/A'), compoundSttHC })}
      </h3>
      
      {hasSignals && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-black mb-2">{t('nmrView.spectralDataTable')}</h4>
          <div className="overflow-x-auto table-responsive">
            <table className="min-w-full custom-table table-fixed">
              <colgroup>
                <col className="w-[25%] sm:w-[20%]" /> 
                <col className="w-[35%] sm:w-[35%]" /> 
                <col className="w-[40%] sm:w-[45%]" /> 
              </colgroup>
              <thead className="bg-gray-100">
                <tr>
                  <th className="custom-table text-black break-words">{t('nmrForm.position')}</th>
                  <th className="custom-table text-black break-words">{t('nmrForm.deltaC')}</th>
                  <th className="custom-table text-black break-words">{t('nmrForm.deltaH')}</th>
                </tr>
              </thead>
              <tbody>
                {nmrDataBlock.signals.map((signal) => (
                  <tr key={signal.id} className="bg-white even:bg-gray-50">
                    <td className="custom-table text-black">{signal.viTri || '-'}</td>
                    <td className="custom-table text-black">{signal.scab || '-'}</td>
                    <td className="custom-table text-black">{signal.shacJHz || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasMeaningfulConditions && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-black mb-2">{t('nmrView.conditionsTable')}</h4>
          <div className="overflow-x-auto table-responsive">
            <table className="min-w-full custom-table table-fixed">
              <colgroup>
                <col className="w-[40%]" /> 
                <col className="w-[30%]" /> 
                <col className="w-[30%]" /> 
              </colgroup>
              <thead className="bg-gray-100">
                <tr>
                  <th className="custom-table text-black break-words">{t('nmrForm.solvent')}</th>
                  <th className="custom-table text-black break-words">{t('nmrForm.freq13c')}</th>
                  <th className="custom-table text-black break-words">{t('nmrForm.freq1h')}</th>
                </tr>
              </thead>
              <tbody>
                {/* Render single condition row */}
                <tr className="bg-white even:bg-gray-50">
                  <td className="custom-table text-black"><ChemicalFormulaDisplay formula={condition.dmNMR} /></td>
                  <td className="custom-table text-black">{condition.tanSo13C || '-'}</td>
                  <td className="custom-table text-black">{condition.tanSo1H || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nmrDataBlock.luuYNMR && nmrDataBlock.luuYNMR.trim() !== '' && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-1">{t('nmrView.notes')}</h4>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{nmrDataBlock.luuYNMR}</p>
        </div>
      )}

      {nmrDataBlock.tltkNMR && nmrDataBlock.tltkNMR.trim() !== '' && (
        <div className="mt-4">
          <h4 className="text-md font-medium text-gray-700 mb-1">{t('nmrView.references')}</h4>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{nmrDataBlock.tltkNMR}</p>
        </div>
      )}
    </div>
  );
};