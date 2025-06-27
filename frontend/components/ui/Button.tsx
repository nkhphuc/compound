import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className, leftIcon, rightIcon, loading = false, ...props }) => {
  const baseStyles = "inline-flex items-center gap-2 justify-center border border-transparent rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";

  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
      break;
    case 'secondary':
      variantStyles = "text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:ring-indigo-500";
      break;
    case 'danger':
      variantStyles = "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500";
      break;
    case 'ghost':
        variantStyles = "text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-indigo-500";
        break;
  }

  let sizeStyles = "";
  switch (size) {
    case 'sm':
      sizeStyles = "px-3 py-1.5 text-xs";
      break;
    case 'md':
      sizeStyles = "px-4 py-2 text-sm";
      break;
    case 'lg':
      sizeStyles = "px-6 py-3 text-base";
      break;
  }

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className || ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 mr-1 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}
      {leftIcon && <span className="flex items-center h-5 w-5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="flex items-center h-5 w-5">{rightIcon}</span>}
    </button>
  );
};
