import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AddCompoundPage } from './pages/AddCompoundPage';
import { EditCompoundPage } from './pages/EditCompoundPage';
import { ViewCompoundPage } from './pages/ViewCompoundPage';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { t } = useTranslation();
  return (
    <MemoryRouter>
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/new" element={<AddCompoundPage />} />
            <Route path="/edit/:id" element={<EditCompoundPage />} />
            <Route path="/view/:id" element={<ViewCompoundPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 text-white text-center p-4 text-sm">
            <div>© {new Date().getFullYear()} {t('appName')}.</div>
            <div className="mt-2 text-gray-400">
                {t('footer.bugReport')}
                <a href="mailto:nkhphuc@gmail.com" className="text-indigo-300 hover:text-indigo-100 underline ml-1">
                    nkhphuc@gmail.com
                </a>
            </div>
        </footer>
      </div>
    </MemoryRouter>
  );
};

export default App;
