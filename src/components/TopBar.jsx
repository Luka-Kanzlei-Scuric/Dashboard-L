import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, BellIcon, ArrowRightOnRectangleIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../auth/context/AuthContext';

const TopBar = ({ sidebarOpen, setSidebarOpen, dashboardName = '' }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Initialen aus dem Namen des Benutzers generieren
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; // Ensure redirect to login
  };

  return (
    <header className="sticky top-0 z-20 flex items-center h-16 px-6 bg-white shadow-sm">
      {dashboardName && (
        <div className="mr-6 hidden md:block">
          <h2 className="text-lg font-semibold text-gray-800">{dashboardName} Dashboard</h2>
        </div>
      )}
      
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-neutral-medium" />
        </div>
        <input
          type="text"
          className="block w-full py-2 pl-10 pr-3 text-sm bg-neutral-lightest border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
          placeholder="Suchen..."
        />
      </div>

      <div className="flex items-center ml-auto">
        <button className="p-1 mr-4 text-neutral-medium rounded-md hover:text-primary focus:outline-none">
          <BellIcon className="w-6 h-6" />
        </button>
        
        <div className="relative flex items-center" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white font-medium">
              {user ? getInitials(user.name) : 'TS'}
            </div>
            <span className="ml-2 text-sm font-medium text-primary hidden md:block">
              {user ? user.name : 'T. Scuric'}
            </span>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg top-full py-1 z-20">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              
              <div className="border-t border-gray-100"></div>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;