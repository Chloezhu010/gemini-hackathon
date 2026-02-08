import React from 'react';
import { Routes, Route, useNavigate, Outlet, Link } from 'react-router-dom';
import MainPage from './components/MainPage';
import GalleryPage from './components/GalleryPage';

const AppLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-3 px-6 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b-4 border-brand-primary/10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div
            className="cursor-pointer flex items-center"
            onClick={() => navigate('/')}
          >
            <img src="/logo-highres.png" alt="WonderComic logo" className="h-14 w-auto object-contain" />
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/gallery"
              className="text-sm font-bold text-brand-muted hover:text-brand-primary transition-colors px-4 py-2 rounded-full hover:bg-brand-light"
            >
              My Library
            </Link>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto w-full px-6 pt-6 flex flex-col flex-1">
        <Outlet />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen selection:bg-brand-accent selection:text-brand-dark bg-brand-light flex flex-col font-sans">
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/book/:id" element={<MainPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
