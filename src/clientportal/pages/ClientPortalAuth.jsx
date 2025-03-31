import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../../config/api';

/**
 * Authentication page for client portal access
 * Requires case number verification before granting access
 */
const ClientPortalAuth = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [caseNumber, setCaseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!caseNumber.trim()) {
      setError('Bitte geben Sie Ihr Aktenzeichen ein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify the case number against the client ID
      const response = await api.post('/clients/verify-access', {
        clientId,
        caseNumber: caseNumber.trim()
      });

      if (response.data.verified) {
        // Set authenticated state in local storage to keep user logged in
        localStorage.setItem('portal_auth_' + clientId, 'true');
        // Redirect to client portal
        navigate(`/portal/view/${clientId}`);
      } else {
        setError('Das eingegebene Aktenzeichen ist nicht korrekt.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Fehler bei der Überprüfung. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="h-10 flex items-center justify-center">
            <img 
              src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
              alt="Logo T. Scuric" 
              className="h-auto w-auto max-h-full max-w-[120px] object-contain" 
            />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-center text-[#9c1a1b] mb-6">
            Zugang zum Mandantenportal
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            Bitte geben Sie Ihr persönliches Aktenzeichen ein, um auf Ihr Mandantenportal zuzugreifen.
          </p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="caseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Aktenzeichen
              </label>
              <input
                type="text"
                id="caseNumber"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="z.B. TS-12345"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#9c1a1b] focus:ring-2 focus:ring-[#9c1a1b]/20 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-[#9c1a1b] text-white rounded-lg hover:bg-[#8a1718] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9c1a1b]/50 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                  Überprüfe...
                </>
              ) : (
                'Portal öffnen'
              )}
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-6 text-center">
            Falls Sie Ihr Aktenzeichen nicht mehr haben, finden Sie es in der E-Mail, 
            die Sie von uns erhalten haben, oder kontaktieren Sie uns unter: 
            <a href="mailto:kontakt@schuldnerberatung-anwalt.de" className="text-[#9c1a1b] hover:underline">
              kontakt@schuldnerberatung-anwalt.de
            </a>
          </p>
        </div>
        
        {/* Media section */}
        <div className="mt-12 text-center">
          <img 
            src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2019/11/medien.png" 
            alt="RTL, Focus Online, Frankfurter Rundschau"
            className="max-w-xs mx-auto"
          />
          <p className="text-xs text-gray-500 mt-2">Vielleicht kennen Sie uns auch aus diesen Medien</p>
        </div>
        
        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-12">
          <div className="flex justify-center mb-3">
            <div className="h-8 flex items-center justify-center">
              <img 
                src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
                alt="Logo T. Scuric" 
                className="h-auto w-auto max-h-full max-w-[80px] object-contain opacity-70" 
              />
            </div>
          </div>
          <p>© 2025 T. Scuric Rechtsanwälte</p>
          <p className="mt-1">Bei Fragen nutzen Sie bitte die Support-Funktion</p>
        </div>
      </main>
    </div>
  );
};

export default ClientPortalAuth;