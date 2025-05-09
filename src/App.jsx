import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClientProvider } from './context/ClientContext';
import { AuthProvider } from './auth/context/AuthContext';
import DocumentUploadPage from './pages/upload/DocumentUploadPage';
import ClientPortalPage from './clientportal/pages/ClientPortalPage';
import ClientPortalAuth from './clientportal/pages/ClientPortalAuth';
import LoginPage from './auth/components/LoginPage';
import PrivateRoute from './auth/components/PrivateRoute';
import NotFoundPage from './pages/NotFoundPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ErrorBoundary from './components/ErrorBoundary';

// New unified layout
import DashboardLayout from './components/layouts/DashboardLayout';

// Backoffice pages
import BackofficeOverview from './pages/backoffice/BackofficeOverview';

// Sales pages
import SalesOverview from './pages/sales/SalesOverview';
import PowerDialerPage from './pages/PowerDialerPage';
import NewPowerDialerPage from './pages/NewPowerDialerPage';

// Settings
import SettingsPage from './pages/settings/SettingsPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClientProvider>
          <Routes>
            {/* Login Route */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Public Routes without Layout */}
            <Route path="/upload/:token" element={<DocumentUploadPage />} />
            
            {/* Client Portal Routes */}
            <Route path="/portal/:clientId" element={<ClientPortalAuth />} />
            <Route path="/portal/view/:clientId" element={<ClientPortalPage />} />
            
            {/* Protected Routes with New Dashboard Layout */}
            <Route element={<PrivateRoute />}>
              {/* Root redirects to sales */}
              <Route path="/" element={<SalesOverview />} />
              
              {/* All dashboards now use the unified layout */}
              <Route element={<DashboardLayout />}>
                {/* Backoffice section */}
                <Route path="/backoffice">
                  <Route index element={<BackofficeOverview />} />
                  <Route path="clients" element={<BackofficeOverview />} />
                  <Route path="documents" element={<div>Dokumente</div>} />
                </Route>
                
                {/* Client detail page */}
                <Route path="/client/:id" element={<ClientDetailPage />} />
                
                {/* Sales section */}
                <Route path="/sales">
                  <Route index element={<SalesOverview />} />
                  <Route path="power-dialer" element={<PowerDialerPage />} />
                  <Route path="simple-dialer" element={<NewPowerDialerPage />} />
                  <Route path="leads" element={<div>Leads</div>} />
                  <Route path="call-logs" element={<div>Anrufprotokolle</div>} />
                </Route>
                
                {/* Settings */}
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* 404 for any unmatched nested routes */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;