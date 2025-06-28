import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NMRSignalData, initialNMRSignalData } from '../types';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

interface NMRSignalCSVInputProps {
  onAddSignals: (signals: NMRSignalData[]) => void;
  onReplaceSignals: (signals: NMRSignalData[]) => void;
  onCancel: () => void;
  existingSignalsCount: number;
}

export const NMRSignalCSVInput: React.FC<NMRSignalCSVInputProps> = ({ onAddSignals, onReplaceSignals, onCancel, existingSignalsCount }) => {
  const { t } = useTranslation();
  const [csvData, setCsvData] = useState('');
  const [error, setError] = useState('');
  const [previewSignals, setPreviewSignals] = useState<NMRSignalData[]>([]);

  const parseCSV = (csvText: string): NMRSignalData[] => {
    const lines = csvText.trim().split('\n');
    const signals: NMRSignalData[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line with proper quoted value handling
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      let j = 0;

      while (j < line.length) {
        const char = line[j];

        if (char === '"') {
          if (inQuotes) {
            // Check for escaped quote (double quote)
            if (j + 1 < line.length && line[j + 1] === '"') {
              currentValue += '"';
              j += 2; // Skip both quotes
              continue;
            } else {
              // End of quoted value
              inQuotes = false;
            }
          } else {
            // Start of quoted value
            inQuotes = true;
          }
        } else if (char === ',' && !inQuotes) {
          // End of value
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          // Regular character
          currentValue += char;
        }

        j++;
      }

      // Add the last value
      values.push(currentValue.trim());

      if (values.length < 3) {
        throw new Error(`Line ${i + 1}: Expected at least 3 columns (Position, δC, δH), got ${values.length}`);
      }

      // Validate that position is not empty
      if (!values[0]) {
        throw new Error(`Line ${i + 1}: Position cannot be empty`);
      }

      const signal: NMRSignalData = {
        ...initialNMRSignalData,
        id: crypto.randomUUID(),
        viTri: values[0] || '',
        scab: values[1] || '',
        shacJHz: values[2] || ''
      };

      signals.push(signal);
    }

    return signals;
  };

  const handleCSVChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCsvData(value);
    setError('');

    if (value.trim()) {
      try {
        const parsed = parseCSV(value);
        setPreviewSignals(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid CSV format');
        setPreviewSignals([]);
      }
    } else {
      setPreviewSignals([]);
    }
  };

  const handleAddSignals = () => {
    if (!csvData.trim()) {
      setError('Please enter CSV data');
      return;
    }

    try {
      const signals = parseCSV(csvData);
      onAddSignals(signals);
      setCsvData('');
      setPreviewSignals([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid CSV format');
    }
  };

  const handleReplaceSignals = () => {
    if (!csvData.trim()) {
      setError('Please enter CSV data');
      return;
    }

    try {
      const signals = parseCSV(csvData);
      onReplaceSignals(signals);
      setCsvData('');
      setPreviewSignals([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid CSV format');
    }
  };

  const handlePasteExample = () => {
    const example = `1,"34,1","1,83 m; 2,03 dd (2,4; 5,4)"
2,"45,2","2,15 s"
3,"67,8","3,45 t (7,2)"
4,"89,3","4,12 d (8,1)"`;
    setCsvData(example);
    handleCSVChange({ target: { value: example } } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  return (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/30">
      <h6 className="text-md font-medium text-gray-700 mb-3">{t('nmrForm.csvInput.title', 'Bulk Input (CSV)')}</h6>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-2">
          {t('nmrForm.csvInput.description', 'Enter data in CSV format: Position, δC (ppm), δH (ppm, J Hz)')}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePasteExample}
          className="text-xs"
        >
          {t('nmrForm.csvInput.pasteExample', 'Paste Example')}
        </Button>
      </div>

      <Textarea
        value={csvData}
        onChange={handleCSVChange}
        placeholder={`1,"34,1","1,83 m; 2,03 dd (2,4; 5,4)"\n2,"45,2","2,15 s"\n3,"67,8","3,45 t (7,2)"`}
        rows={6}
        className="font-mono text-sm"
      />

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {previewSignals.length > 0 && (
        <div className="mt-3">
          <h6 className="text-sm font-medium text-gray-700 mb-2">
            {t('nmrForm.csvInput.preview', 'Preview')} ({previewSignals.length} {t('nmrForm.csvInput.signals', 'signals')})
          </h6>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded bg-white">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">{t('nmrForm.position')}</th>
                  <th className="px-2 py-1 text-left">{t('nmrForm.deltaC')}</th>
                  <th className="px-2 py-1 text-left">{t('nmrForm.deltaH')}</th>
                </tr>
              </thead>
              <tbody>
                {previewSignals.slice(0, 5).map((signal, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="px-2 py-1">{signal.viTri}</td>
                    <td className="px-2 py-1">{signal.scab}</td>
                    <td className="px-2 py-1">{signal.shacJHz}</td>
                  </tr>
                ))}
                {previewSignals.length > 5 && (
                  <tr>
                    <td colSpan={3} className="px-2 py-1 text-xs text-gray-500 text-center">
                      ... and {previewSignals.length - 5} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex space-x-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddSignals}
          disabled={!csvData.trim() || !!error}
        >
          {t('nmrForm.csvInput.addSignals', 'Add Signals')}
        </Button>
        {existingSignalsCount > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleReplaceSignals}
            disabled={!csvData.trim() || !!error}
            title={`This will replace ${existingSignalsCount} existing signal(s)`}
          >
            {t('nmrForm.csvInput.replaceSignals', 'Replace All Signals')}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          {t('buttons.cancel', 'Cancel')}
        </Button>
      </div>
    </div>
  );
};
