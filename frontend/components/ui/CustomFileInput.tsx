import React, { useRef } from 'react';

interface CustomFileInputProps {
  id: string;
  label: string; // Text for the button-like label
  selectedFileName?: string;
  placeholder?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

export const CustomFileInput: React.FC<CustomFileInputProps> = ({
  id,
  label,
  selectedFileName,
  placeholder = 'No file selected.',
  onChange,
  accept,
  wrapperClassName = '',
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLabelClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={`flex items-center space-x-2 ${wrapperClassName}`}>
      <input
        type="file"
        id={id}
        ref={inputRef}
        className="hidden"
        onChange={onChange}
        accept={accept}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleLabelClick}
        disabled={disabled}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      <span className="text-sm text-gray-500 truncate" title={selectedFileName || placeholder}>
        {selectedFileName || placeholder}
      </span>
    </div>
  );
};
