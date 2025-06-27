
import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg p-6 mb-8 ${className || ''}`}>
      <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-300 pb-3 mb-6">{title}</h2>
      {children}
    </div>
  );
};