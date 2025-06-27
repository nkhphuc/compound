
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string | number; label: string }>;
  wrapperClassName?: string;
  placeholder?: string;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, id, options, wrapperClassName, className, placeholder, required, ...props }) => {
  return (
    <div className={`mb-4 ${wrapperClassName || ''}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${className || ''}`}
        {...props}
      >
        {placeholder && <option value="" disabled={props.value === undefined || props.value === ''}>{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};
