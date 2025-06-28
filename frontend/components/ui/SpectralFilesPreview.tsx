import React from 'react';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../../services/urlService';
import { TrashIcon } from '../icons/TrashIcon';

interface FileInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface SpectralFilesPreviewProps {
  files: FileInfo[];
  fieldLabel: string;
  onRemoveFile: (fileId: string) => Promise<void>;
  onRemoveAll: () => Promise<void>;
}

export const SpectralFilesPreview: React.FC<SpectralFilesPreviewProps> = ({
  files,
  fieldLabel,
  onRemoveFile,
  onRemoveAll,
}) => {
  const { t } = useTranslation();

  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-gray-700">
          {t('fileUpload.fieldFiles', { fieldLabel, count: files.length })}
        </h5>
        <button
          type="button"
          onClick={async () => await onRemoveAll()}
          className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
        >
          {t('fileUpload.removeAll')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map((file) => (
          <div key={file.id} className="border rounded-lg p-3 bg-white shadow-sm">
            {/* File Preview */}
            <div className="mb-2">
              {file.type.startsWith('image/') ? (
                <img
                  src={getImageUrl(file.url)}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-1">📄</div>
                    <div className="text-xs text-gray-500">PDF</div>
                  </div>
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                {file.name}
              </p>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <a
                  href={getImageUrl(file.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  {t('fileUpload.view')}
                </a>
                <button
                  type="button"
                  onClick={async () => await onRemoveFile(file.id)}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center"
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  {t('fileUpload.remove')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
