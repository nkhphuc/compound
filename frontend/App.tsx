import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';

const HomePage = lazy(() => import('./pages/HomePage'));
const AddCompoundPage = lazy(() => import('./pages/AddCompoundPage'));
const EditCompoundPage = lazy(() => import('./pages/EditCompoundPage'));
const ViewCompoundPage = lazy(() => import('./pages/ViewCompoundPage'));

const App: React.FC = () => {
  const { t } = useTranslation();
  return (
    <MemoryRouter>
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={<div className="text-center mt-10 text-lg">Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/new" element={<AddCompoundPage />} />
              <Route path="/edit/:id" element={<EditCompoundPage />} />
              <Route path="/view/:id" element={<ViewCompoundPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
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
