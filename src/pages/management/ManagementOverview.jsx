import React from 'react';
import { 
  ChartBarIcon, 
  ChartPieIcon, 
  UsersIcon, 
  PresentationChartLineIcon, 
  InformationCircleIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ManagementOverview = () => {
  // Dummy data for the KPI cards
  const kpis = [
    { id: 1, title: 'Umsatz', value: '€125,400', trend: '+14%', trendUp: true },
    { id: 2, title: 'Neue Kunden', value: '53', trend: '+9%', trendUp: true },
    { id: 3, title: 'Durchschn. Bearbeitungszeit', value: '7.2 Tage', trend: '-12%', trendUp: true },
    { id: 4, title: 'Erfolgsquote', value: '68%', trend: '+5%', trendUp: true },
  ];

  // Dummy data for team performance
  const teamPerformance = [
    { id: 1, name: 'Backoffice', progress: 85, target: 90 },
    { id: 2, name: 'Sales', progress: 92, target: 80 },
    { id: 3, name: 'Kundenbetreuung', progress: 76, target: 85 },
    { id: 4, name: 'Buchhaltung', progress: 95, target: 95 },
  ];

  // Quick access modules
  const modules = [
    { 
      id: 'analytics',
      title: 'Analytics',
      description: 'Detaillierte Geschäftsanalytik',
      icon: <ChartBarIcon className="h-8 w-8 text-purple-500" />,
      path: '/management/analytics',
      color: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    { 
      id: 'reports',
      title: 'Berichte',
      description: 'Monatliche und wöchentliche Reports',
      icon: <PresentationChartLineIcon className="h-8 w-8 text-blue-500" />,
      path: '/management/reports',
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    { 
      id: 'statistics',
      title: 'Statistiken',
      description: 'Leistungs- und Trendanalysen',
      icon: <ChartPieIcon className="h-8 w-8 text-green-500" />,
      path: '/management/statistics',
      color: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    { 
      id: 'team',
      title: 'Team',
      description: 'Mitarbeiterleistung und -verwaltung',
      icon: <UsersIcon className="h-8 w-8 text-amber-500" />,
      path: '/management/team',
      color: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Management Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="bg-white rounded-xl shadow-sm p-5 border border-neutral-light">
            <div className="text-neutral-medium text-sm font-medium">{kpi.title}</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900">{kpi.value}</div>
              <div className={`flex items-center text-sm font-medium ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${kpi.trendUp ? '' : 'transform rotate-180'}`} />
                {kpi.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-light">
        <div className="px-6 py-4 border-b border-neutral-light bg-neutral-lightest flex justify-between items-center">
          <h2 className="font-semibold text-primary">Team Leistungsübersicht</h2>
          <span className="text-sm text-neutral-medium">Monatliche Ziele</span>
        </div>
        <div className="p-6 space-y-4">
          {teamPerformance.map((team) => (
            <div key={team.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-900">{team.name}</span>
                <span className="text-sm text-neutral-medium">{team.progress}% / {team.target}%</span>
              </div>
              <div className="w-full bg-neutral-lightest rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    team.progress >= team.target 
                      ? 'bg-green-500' 
                      : team.progress >= team.target * 0.8 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`} 
                  style={{ width: `${team.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((module) => (
          <Link
            key={module.id}
            to={module.path}
            className={`${module.color} ${module.borderColor} border rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow`}
          >
            <div className="mb-3">{module.icon}</div>
            <h3 className="font-semibold text-lg text-gray-900">{module.title}</h3>
            <p className="text-neutral-medium mt-1 text-sm">{module.description}</p>
          </Link>
        ))}
      </div>

      {/* Note/Alert Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
        <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-blue-800">Administrationsbereich</h3>
          <p className="mt-1 text-sm text-blue-600">
            Dies ist ein Prototyp des Management-Dashboards. Weitere Features werden in Kürze hinzugefügt. Kontaktieren Sie das Entwicklungsteam für Vorschläge oder Featurerequests.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManagementOverview;