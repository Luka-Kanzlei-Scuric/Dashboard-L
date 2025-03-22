import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClientProvider } from './context/ClientContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ClientDetailPage from './pages/ClientDetailPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ClientProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="client/:id" element={<ClientDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ClientProvider>
  );
}

export default App;