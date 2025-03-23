import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClientProvider } from './context/ClientContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ClientDetailPage from './pages/ClientDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import DocumentUploadPage from './pages/upload/DocumentUploadPage';

function App() {
  return (
    <ClientProvider>
      <Routes>
        {/* Dashboard Routes mit Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="client/:id" element={<ClientDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        
        {/* Öffentliche Routes ohne Layout */}
        <Route path="/upload/:token" element={<DocumentUploadPage />} />
      </Routes>
    </ClientProvider>
  );
}

export default App;