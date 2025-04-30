import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingOffice2Icon, 
  PhoneIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const DashboardSelector = () => {
  const navigate = useNavigate();

  const dashboards = [
    {
      id: 'backoffice',
      title: 'Backoffice',
      description: 'Zugriff auf Mandanten, Dokumente und Verwaltung',
      icon: <BuildingOffice2Icon className="h-24 w-24 text-blue-500" />,
      path: '/backoffice',
      color: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      shadowColor: 'shadow-blue-200/50'
    },
    {
      id: 'sales',
      title: 'Sales',
      description: 'Power-Dialer und Vertriebstools',
      icon: <PhoneIcon className="h-24 w-24 text-green-500" />,
      path: '/sales',
      color: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200',
      shadowColor: 'shadow-green-200/50'
    },
    {
      id: 'management',
      title: 'Management',
      description: 'Berichte, Statistiken und Übersichten',
      icon: <ChartBarIcon className="h-24 w-24 text-purple-500" />,
      path: '/management',
      color: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      shadowColor: 'shadow-purple-200/50'
    }
  ];

  const handleDashboardSelect = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16">
          <div className="mb-6 flex justify-center">
            <img 
              src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
              alt="Logo T. Scuric" 
              className="h-24 object-contain" 
            />
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 mb-3">Dashboard Auswahl</h1>
          <p className="text-lg text-gray-600">Wählen Sie einen Bereich, um fortzufahren</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {dashboards.map((dashboard) => (
            <button
              key={dashboard.id}
              onClick={() => handleDashboardSelect(dashboard.path)}
              className={`flex flex-col items-center p-8 rounded-2xl border ${dashboard.borderColor} ${dashboard.color} 
                shadow-xl ${dashboard.shadowColor} transition-all duration-300
                hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-secondary`}
            >
              <div className="mb-6 transition-transform duration-300 transform group-hover:scale-110">
                {dashboard.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{dashboard.title}</h2>
              <p className="text-gray-600 text-center">{dashboard.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSelector;