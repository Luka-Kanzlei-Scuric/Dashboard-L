import React from 'react';
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';

const TopBar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="sticky top-0 z-20 flex items-center h-16 px-6 bg-white shadow-sm">
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
        
        <div className="relative flex items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white font-medium">
              KA
            </div>
            <span className="ml-2 text-sm font-medium text-primary hidden md:block">Kanzlei Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;