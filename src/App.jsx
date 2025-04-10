import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClientProvider } from './context/ClientContext';
import { AuthProvider } from './auth/context/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ClientDetailPage from './pages/ClientDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import DocumentUploadPage from './pages/upload/DocumentUploadPage';
import ClientPortalPage from './clientportal/pages/ClientPortalPage';
import ClientPortalAuth from './clientportal/pages/ClientPortalAuth';
import LoginPage from './auth/components/LoginPage';
import PrivateRoute from './auth/components/PrivateRoute';
import PowerDialerPage from './pages/PowerDialerPage';

function App() {
  return (
    <AuthProvider>
      <ClientProvider>
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Geschützte Dashboard-Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="power-dialer" element={<PowerDialerPage />} />
              <Route path="client/:id" element={<ClientDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
          
          {/* Öffentliche Routes ohne Layout */}
          <Route path="/upload/:token" element={<DocumentUploadPage />} />
          
          {/* Kundenportal Routes - Auth und Ansicht getrennt */}
          <Route path="/portal/:clientId" element={<ClientPortalAuth />} />
          <Route path="/portal/view/:clientId" element={<ClientPortalPage />} />
        </Routes>
      </ClientProvider>
    </AuthProvider>
  );
}

export default App;