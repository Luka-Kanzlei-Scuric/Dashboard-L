import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  BuildingOffice2Icon, 
  HomeIcon,
  UserIcon,
  DocumentIcon,
  ArrowLeftCircleIcon, 
  ArrowRightCircleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import TopBar from '../TopBar';

const BackofficeLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  return (
    <div className="flex h-screen bg-neutral-lightest">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-20'
        } border-r border-neutral-light`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 border-b border-neutral-light px-4">
          {sidebarOpen ? (
            <>
              <div className="flex items-center">
                <div className="h-12 w-auto flex items-center justify-center">
                  <img 
                    src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
                    alt="Logo T. Scuric" 
                    className="h-auto w-auto max-h-full max-w-[120px] object-contain" 
                  />
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-full text-neutral-medium hover:text-secondary transition-colors"
              >
                <ArrowLeftCircleIcon className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <div className="h-9 w-9 flex items-center justify-center">
                <img 
                  src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
                  alt="Logo T. Scuric" 
                  className="h-auto w-auto max-h-full max-w-full object-contain" 
                />
              </div>
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded-full text-neutral-medium hover:text-secondary transition-colors"
              >
                <ArrowRightCircleIcon className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Dashboard Name */}
        {sidebarOpen && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="text-blue-800 font-medium">Backoffice Dashboard</div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem 
            to="/backoffice" 
            icon={<HomeIcon className="w-6 h-6" />} 
            title="Übersicht" 
            sidebarOpen={sidebarOpen} 
          />
          <NavItem 
            to="/backoffice/clients" 
            icon={<UserIcon className="w-6 h-6" />} 
            title="Mandanten" 
            sidebarOpen={sidebarOpen} 
          />
          {/* Dieser Route ist absichtlich auskommentiert, da wir die alten Client-URLs für Kompatibilität beibehalten */}
          {/* <NavItem 
            to="/backoffice/client/:id" 
            icon={<UserIcon className="w-6 h-6" />} 
            title="Mandanten Details" 
            sidebarOpen={sidebarOpen} 
          /> */}
          <NavItem 
            to="/backoffice/documents" 
            icon={<DocumentIcon className="w-6 h-6" />} 
            title="Dokumente" 
            sidebarOpen={sidebarOpen} 
          />
        </nav>

        {/* Footer - Navigate Back & Logout */}
        <div className="p-3 border-t border-neutral-light space-y-1">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-200 text-neutral-dark hover:bg-neutral-lightest hover:text-secondary`}
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span className="ml-3 font-medium">Zurück zur Auswahl</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} dashboardName="Backoffice" />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, title, sidebarOpen }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 
        ${isActive 
          ? 'bg-blue-500 text-white' 
          : 'text-neutral-dark hover:bg-neutral-lightest hover:text-blue-500'
        }`
      }
      end={to === '/backoffice'}
    >
      {icon}
      {sidebarOpen && <span className="ml-3 font-medium">{title}</span>}
    </NavLink>
  );
};

export default BackofficeLayout;