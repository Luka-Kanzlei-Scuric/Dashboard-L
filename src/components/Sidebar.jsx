import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  Cog6ToothIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <div 
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-64' : 'w-20'
      } border-r border-neutral-light`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 border-b border-neutral-light px-4">
        {sidebarOpen ? (
          <>
            <h1 className="text-xl font-semibold text-primary">Kanzlei</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-full text-neutral-medium hover:text-secondary transition-colors"
            >
              <ArrowLeftCircleIcon className="w-6 h-6" />
            </button>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-secondary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-full text-neutral-medium hover:text-secondary transition-colors"
            >
              <ArrowRightCircleIcon className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem 
          to="/" 
          icon={<HomeIcon className="w-6 h-6" />} 
          title="Dashboard" 
          sidebarOpen={sidebarOpen} 
        />
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-light">
        <NavItem 
          to="/settings" 
          icon={<Cog6ToothIcon className="w-6 h-6" />} 
          title="Einstellungen" 
          sidebarOpen={sidebarOpen} 
        />
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
          ? 'bg-secondary text-white' 
          : 'text-neutral-dark hover:bg-neutral-lightest hover:text-secondary'
        }`
      }
    >
      {icon}
      {sidebarOpen && <span className="ml-3 font-medium">{title}</span>}
    </NavLink>
  );
};

export default Sidebar;