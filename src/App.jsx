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

// Dashboard selector
import DashboardSelector from './pages/DashboardSelector';

// Team-specific layouts
import BackofficeLayout from './components/layouts/BackofficeLayout';
import SalesLayout from './components/layouts/SalesLayout';
import ManagementLayout from './components/layouts/ManagementLayout';

// Backoffice pages
import BackofficeOverview from './pages/backoffice/BackofficeOverview';

// Sales pages
import SalesOverview from './pages/sales/SalesOverview';
import PowerDialerPage from './pages/PowerDialerPage';
import NewPowerDialerPage from './pages/NewPowerDialerPage';

// Management pages
import ManagementOverview from './pages/management/ManagementOverview';

function App() {
  return (
    <AuthProvider>
      <ClientProvider>
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main dashboard selector */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<DashboardSelector />} />
            
            {/* Backoffice Dashboard */}
            <Route path="/backoffice" element={<BackofficeLayout />}>
              <Route index element={<BackofficeOverview />} />
              <Route path="clients" element={<BackofficeOverview />} />
              <Route path="client/:id" element={<ClientDetailPage />} />
              <Route path="documents" element={<div>Dokumente</div>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            
            {/* Sales Dashboard */}
            <Route path="/sales" element={<SalesLayout />}>
              <Route index element={<SalesOverview />} />
              <Route path="power-dialer" element={<PowerDialerPage />} />
              <Route path="simple-dialer" element={<NewPowerDialerPage />} />
              <Route path="leads" element={<div>Leads</div>} />
              <Route path="call-logs" element={<div>Anrufprotokolle</div>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            
            {/* Management Dashboard */}
            <Route path="/management" element={<ManagementLayout />}>
              <Route index element={<ManagementOverview />} />
              <Route path="analytics" element={<div>Analytics</div>} />
              <Route path="reports" element={<div>Berichte</div>} />
              <Route path="statistics" element={<div>Statistiken</div>} />
              <Route path="team" element={<div>Teammitglieder</div>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
          
          {/* Öffentliche Routes ohne Layout */}
          <Route path="/upload/:token" element={<DocumentUploadPage />} />
          
          {/* Kundenportal Routes - Auth und Ansicht getrennt */}
          <Route path="/portal/:clientId" element={<ClientPortalAuth />} />
          <Route path="/portal/view/:clientId" element={<ClientPortalPage />} />
          
          {/* Fallback route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ClientProvider>
    </AuthProvider>
  );
}

export default App;