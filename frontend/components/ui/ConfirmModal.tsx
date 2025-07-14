import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white"
        onClick={e => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
            {title}
          </h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
          <div className="items-center px-4 py-3 space-x-4">
            <Button
              variant="secondary"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              {t('confirmModal.cancelButton')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onConfirm();
                onClose(); // Close modal after confirm
              }}
              className="px-4 py-2"
            >
              {t('confirmModal.confirmDeleteButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
