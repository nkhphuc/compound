import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { useTranslation } from 'react-i18next';

// Simple Language Switcher Component defined within Navbar.tsx
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeLanguage('en')}
        className={` ${i18n.language.startsWith('en') ? 'bg-white text-indigo-700' : 'text-white hover:bg-white/20'}`}
      >
        EN
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeLanguage('vi')}
        className={` ${i18n.language === 'vi' ? 'bg-white text-indigo-700' : 'text-white hover:bg-white/20'}`}
      >
        VI
      </Button>
    </div>
  );
};

// Favicon Component
const Favicon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" className="w-8 h-8">
    {/* Background circle */}
    <circle cx="16" cy="16" r="15" fill="#4338ca" stroke="#312e81" strokeWidth="2"/>

    {/* Chemistry flask */}
    <path d="M12 8h8v2h-8z" fill="white"/>
    <path d="M10 10h12v2h-12z" fill="white"/>
    <path d="M8 12h16l-2 12h-12z" fill="white"/>

    {/* Bubbles */}
    <circle cx="14" cy="18" r="1.5" fill="#4338ca"/>
    <circle cx="18" cy="20" r="1" fill="#4338ca"/>
    <circle cx="16" cy="22" r="1.2" fill="#4338ca"/>
  </svg>
);

export const Navbar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="bg-gradient-to-r from-indigo-700 to-purple-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
              {/* Favicon - visible on small screens */}
              <div className="sm:hidden">
                <Favicon />
              </div>
              {/* Title - hidden on small screens, visible on sm and up */}
              <span className="hidden sm:block text-2xl font-bold text-white">
                {t('navbar.title')}
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link to="/new">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center h-10 px-4 ml-2 border border-white/30 rounded-lg text-white hover:bg-white/20 transition"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('navbar.addNew')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
