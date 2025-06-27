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


export const Navbar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="bg-gradient-to-r from-indigo-700 to-purple-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-white hover:opacity-90 transition-opacity">
              {t('navbar.title')}
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link to="/new">
              <Button variant="secondary" size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50" leftIcon={<PlusIcon className="w-4 h-4"/>}>
                {t('navbar.addNew')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};