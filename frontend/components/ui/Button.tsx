
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className, leftIcon, rightIcon, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center border border-transparent rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  
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
      {...props}
    >
      {leftIcon && <span className="mr-2 -ml-1 h-5 w-5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 -mr-1 h-5 w-5">{rightIcon}</span>}
    </button>
  );
};