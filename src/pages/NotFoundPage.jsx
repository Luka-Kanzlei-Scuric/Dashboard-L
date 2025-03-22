import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-8xl font-bold text-neutral-light">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-primary">Seite nicht gefunden</h2>
      <p className="mt-2 text-neutral-medium">Die von Ihnen angeforderte Seite konnte nicht gefunden werden.</p>
      <Link 
        to="/" 
        className="mt-8 inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-light transition-colors"
      >
        <HomeIcon className="h-5 w-5 mr-2" />
        Zurück zur Startseite
      </Link>
    </div>
  );
};

export default NotFoundPage;