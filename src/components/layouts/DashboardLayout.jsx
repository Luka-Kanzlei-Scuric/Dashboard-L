import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Home, 
  LineChart, 
  Circle, 
  Briefcase, 
  Settings,
  Users,
  MessageSquare,
  Building,
  Phone,
  PhoneCall,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  RotateCw,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState(getInitialActiveTab());
  const [expandedSales, setExpandedSales] = useState(isInSalesSection());
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Helper function to determine initial active tab based on URL
  function getInitialActiveTab() {
    const path = location.pathname;
    if (path.includes('/backoffice')) return 'backoffice';
    if (path.includes('/sales/power-dialer')) return 'power-dialer';
    if (path.includes('/sales')) return 'sales';
    if (path.includes('/client')) return 'mandanten';
    return 'all';
  }

  // Helper function to check if we're in the sales section
  function isInSalesSection() {
    return location.pathname.includes('/sales');
  }

  // Handle tab changes with navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    switch(tab) {
      case 'mandanten':
        navigate('/backoffice/clients');
        break;
      case 'chat':
        // This isn't implemented yet
        break;
      case 'backoffice':
        navigate('/backoffice');
        break;
      case 'sales':
        navigate('/sales');
        break;
      case 'power-dialer':
        navigate('/sales/power-dialer');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Black Sidebar */}
      <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 rounded-r-lg">
        <div className="mb-10">
          <LayoutGrid className="text-white" size={24} />
        </div>
        <div className="flex flex-col items-center space-y-8 flex-1">
          <Home 
            className={`${activeTab === 'all' ? 'text-white' : 'text-gray-400'} hover:text-white cursor-pointer`} 
            size={20} 
            onClick={() => navigate('/')}
          />
          <div className={`${activeTab === 'mandanten' ? 'bg-zinc-700 p-2 rounded-md' : ''}`}>
            <Circle 
              className={`${activeTab === 'mandanten' ? 'text-white' : 'text-gray-400'} hover:text-white cursor-pointer`} 
              size={20} 
              onClick={() => handleTabChange('mandanten')}
            />
          </div>
          <Briefcase 
            className={`${activeTab === 'backoffice' ? 'text-white' : 'text-gray-400'} hover:text-white cursor-pointer`} 
            size={20} 
            onClick={() => handleTabChange('backoffice')}
          />
          <div className="flex-1"></div>
          <Settings 
            className="text-gray-400 hover:text-white cursor-pointer" 
            size={20} 
            onClick={() => navigate('/settings')}
          />
          <LogOut 
            className="text-gray-400 hover:text-white cursor-pointer" 
            size={20} 
            onClick={handleLogout}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Panel - Grey/Light-blue Tab */}
        <div className="w-80 bg-gray-100 p-6 rounded-r-lg">
          <h1 className="text-xl font-semibold mb-6">Actions</h1>
          
          {/* Main Tabs */}
          <div className="mb-6 space-y-1">
            <div 
              className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'mandanten' ? 'bg-gray-200' : ''}`} 
              onClick={() => handleTabChange('mandanten')}
            >
              <div className="flex items-center">
                <Users size={18} className="mr-3 text-gray-600" />
                <span className="text-gray-700">Mandanten</span>
              </div>
            </div>
            <div 
              className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'chat' ? 'bg-gray-200' : ''}`} 
              onClick={() => handleTabChange('chat')}
            >
              <div className="flex items-center">
                <MessageSquare size={18} className="mr-3 text-gray-600" />
                <span className="text-gray-700">Chat</span>
              </div>
            </div>
          </div>
          
          {/* Abteilung Section */}
          <div>
            <h2 className="text-gray-400 text-sm mb-2">Abteilung</h2>
            <div className="space-y-1">
              <div 
                className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'backoffice' ? 'bg-gray-200' : ''}`} 
                onClick={() => handleTabChange('backoffice')}
              >
                <div className="flex items-center">
                  <Building size={18} className="mr-3 text-gray-600" />
                  <span className="text-gray-700">Backoffice</span>
                </div>
              </div>
              
              {/* Sales with subtabs */}
              <div>
                <div 
                  className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'sales' || expandedSales ? 'bg-gray-200' : ''}`} 
                  onClick={() => {
                    setExpandedSales(!expandedSales);
                    handleTabChange('sales');
                  }}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <Phone size={18} className="text-gray-600" />
                    </div>
                    <span className="text-gray-700">Sales</span>
                  </div>
                  {expandedSales ? 
                    <ChevronUp size={18} className="text-gray-400" /> : 
                    <ChevronDown size={18} className="text-gray-400" />
                  }
                </div>
                
                {/* Sales subtabs */}
                {expandedSales && (
                  <div className="relative ml-4 mt-1">
                    {/* Rounded connector line */}
                    <div className="absolute left-0 top-0 h-full">
                      <div className="absolute left-0 top-0 h-full w-4">
                        <div className="absolute left-0 top-0 h-full w-[1px] bg-gray-300"></div>
                        <div className="absolute left-0 top-0 h-4 w-4 border-l border-b rounded-bl-lg border-gray-300"></div>
                      </div>
                    </div>
                    
                    {/* Subtab content */}
                    <div className="pl-4">
                      <div 
                        className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'power-dialer' ? 'bg-gray-200' : ''}`} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTabChange('power-dialer');
                        }}
                      >
                        <div className="flex items-center">
                          <PhoneCall size={16} className="mr-3 text-gray-600" />
                          <span className="text-gray-700">Power-Dialer</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Content Area - White with borders */}
        <div className="flex-1 p-6">
          <div className="bg-white h-full rounded-xl overflow-auto border border-gray-200 shadow-sm p-6">
            {/* Content output from the routes */}
            <Outlet />
          </div>
        </div>
      </div>
      
      {/* Refresh Button */}
      <button 
        className="fixed bottom-6 right-6 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100"
        onClick={handleRefresh}
      >
        <RotateCw size={24} />
      </button>
    </div>
  );
};

export default DashboardLayout;