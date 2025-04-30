import React from 'react';
import { PhoneIcon, UserGroupIcon, ClipboardDocumentListIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const SalesOverview = () => {
  // Dummy data for the sales dashboard
  const salesStats = [
    { id: 1, title: 'Anrufe heute', value: '47', trend: '+12%', trendUp: true },
    { id: 2, title: 'Erfolgsrate', value: '32%', trend: '+5%', trendUp: true },
    { id: 3, title: 'Neue Leads', value: '28', trend: '+3%', trendUp: true },
    { id: 4, title: 'Durchschn. Anrufdauer', value: '4:32', trend: '-8%', trendUp: false },
  ];

  // Dummy data for recent calls
  const recentCalls = [
    { id: 1, name: 'Max Mustermann', phone: '+49 123 456789', time: '13:45', status: 'erfolgreich' },
    { id: 2, name: 'Anna Schmidt', phone: '+49 987 654321', time: '13:30', status: 'nicht erreicht' },
    { id: 3, name: 'Klaus Weber', phone: '+49 111 222333', time: '13:15', status: 'erfolgreich' },
    { id: 4, name: 'Laura Meyer', phone: '+49 444 555666', time: '12:50', status: 'abgelehnt' },
    { id: 5, name: 'Thomas Müller', phone: '+49 777 888999', time: '12:25', status: 'erfolgreich' },
  ];

  // Quick action cards
  const quickActions = [
    { 
      id: 'power-dialer',
      title: 'Power-Dialer',
      description: 'Automatisierte Anrufe starten',
      icon: <PhoneIcon className="h-8 w-8 text-green-500" />,
      path: '/sales/power-dialer',
      color: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      id: 'simple-dialer',
      title: 'Einfacher Dialer',
      description: 'Einzelanrufe tätigen',
      icon: <PhoneIcon className="h-8 w-8 text-blue-500" />,
      path: '/sales/simple-dialer',
      color: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'leads',
      title: 'Leads verwalten',
      description: 'Lead-Datenbank durchsuchen',
      icon: <UserGroupIcon className="h-8 w-8 text-purple-500" />,
      path: '/sales/leads',
      color: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      id: 'call-logs',
      title: 'Anrufprotokolle',
      description: 'Vergangene Anrufe einsehen',
      icon: <ClipboardDocumentListIcon className="h-8 w-8 text-amber-500" />,
      path: '/sales/call-logs',
      color: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Sales Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {salesStats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-xl shadow-sm p-5 border border-neutral-light flex flex-col">
            <div className="text-neutral-medium text-sm font-medium">{stat.title}</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className={`flex items-center text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${stat.trendUp ? '' : 'transform rotate-180'}`} />
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            to={action.path}
            className={`${action.color} ${action.borderColor} border rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow`}
          >
            <div className="mb-3">{action.icon}</div>
            <h3 className="font-semibold text-lg text-gray-900">{action.title}</h3>
            <p className="text-neutral-medium mt-1 text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Calls Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-light">
        <div className="px-6 py-4 border-b border-neutral-light bg-neutral-lightest">
          <h2 className="font-semibold text-primary">Letzte Anrufe</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-light">
            <thead className="bg-neutral-lightest">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Zeit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-light">
              {recentCalls.map((call) => (
                <tr key={call.id} className="hover:bg-neutral-lightest transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{call.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">{call.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">{call.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      call.status === 'erfolgreich' 
                        ? 'bg-green-100 text-green-800' 
                        : call.status === 'nicht erreicht'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {call.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;