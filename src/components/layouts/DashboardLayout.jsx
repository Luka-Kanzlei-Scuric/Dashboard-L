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
  ChevronLeft,
  RotateCw,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';

// Helper function to determine initial active tab based on URL
function getInitialActiveTab(pathname) {
  if (pathname.includes('/backoffice')) return 'backoffice';
  if (pathname.includes('/sales/power-dialer')) return 'power-dialer';
  if (pathname.includes('/sales')) return 'sales';
  if (pathname.includes('/client')) return 'mandanten';
  return 'all';
}

// Helper function to check if we're in the sales section
function isInSalesSection(pathname) {
  return pathname.includes('/sales');
}

const DashboardLayout = () => {
  const location = useLocation();
  // Use this to track the current section for highlighting in the sidebar
  const [currentTab, setCurrentTab] = useState(getInitialActiveTab(location.pathname));
  // Track if sales menu is expanded
  const [expandedSales, setExpandedSales] = useState(false);
  // Track if the actions panel is collapsed
  const [actionsCollapsed, setActionsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Update current tab when location changes
  React.useEffect(() => {
    setCurrentTab(getInitialActiveTab(location.pathname));
    // If we're in the sales section, expand the sales menu
    if (location.pathname.includes('/sales')) {
      setExpandedSales(true);
    }
  }, [location.pathname]);

  // Handle tab changes with navigation
  // Wartungshinweis anzeigen für Bereiche, die noch nicht implementiert sind
  const showMaintenanceAlert = (feature) => {
    alert(`Der Bereich "${feature}" befindet sich derzeit im Aufbau und wird in Kürze verfügbar sein.`);
  };

  const handleTabChange = (tab) => {
    // Update the current tab 
    setCurrentTab(tab);
    
    // Prüfen, ob es sich um einen noch nicht implementierten Bereich handelt
    if (tab === 'chat' || tab === 'mandanten' || tab === 'sales' || tab === 'home' || tab === 'settings') {
      showMaintenanceAlert(
        tab === 'chat' ? 'Chat' : 
        tab === 'mandanten' ? 'Mandanten' : 
        tab === 'sales' ? 'Sales' :
        tab === 'home' ? 'Home' : 'Einstellungen'
      );
      
      // Bei Sales den Status nicht ändern, aber das Menü erweitern,
      // damit der Power Dialer erreicht werden kann
      if (tab === 'sales') {
        setExpandedSales(!expandedSales);
      }
      
      return;
    }
    
    // Handle sales tab special case for menu expansion
    if (tab === 'power-dialer') {
      setExpandedSales(true);
    } else if (!tab.includes('sales')) {
      // For non-sales tabs, collapse the sales menu
      setExpandedSales(false);
    }
    
    // Navigate based on the tab
    switch(tab) {
      case 'backoffice':
        navigate('/backoffice');
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
          <div className="relative">
            <Home 
              className="text-gray-400 hover:text-white cursor-pointer" 
              size={20} 
              onClick={() => handleTabChange('home')}
            />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" title="In Arbeit"></div>
          </div>
          <div className="bg-zinc-700 p-2 rounded-md">
            <Circle 
              className="text-white hover:text-white cursor-pointer" 
              size={20} 
              onClick={() => handleTabChange('mandanten')}
            />
          </div>
          <Briefcase 
            className="text-gray-400 hover:text-white cursor-pointer" 
            size={20} 
            onClick={() => handleTabChange('backoffice')}
          />
          <div className="flex-1"></div>
          <div className="relative">
            <Settings 
              className="text-gray-400 hover:text-white cursor-pointer" 
              size={20} 
              onClick={() => handleTabChange('settings')}
            />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" title="In Arbeit"></div>
          </div>
          <LogOut 
            className="text-gray-400 hover:text-white cursor-pointer" 
            size={20} 
            onClick={handleLogout}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Container for the panel and expand button when collapsed */}
        <div className="relative flex">
          {/* When panel is collapsed, show expand button */}
          {actionsCollapsed && (
            <button 
              className="h-10 bg-gray-200 rounded-r p-1 my-6 shadow-md z-10 hover:bg-gray-300 flex items-center justify-center"
              onClick={() => setActionsCollapsed(false)}
              title="Panel öffnen"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
          
          {/* Left Panel - Grey/Light-blue Tab */}
          <div className={`${actionsCollapsed ? 'w-0 overflow-hidden' : 'w-80'} transition-all duration-300 bg-gray-100 rounded-r-lg relative`}>
            {/* Toggle button for collapsing the actions panel - positioned absolutely */}
            {!actionsCollapsed && (
              <button 
                className="absolute -right-3 top-6 bg-gray-200 rounded-full p-1 shadow-md z-10 hover:bg-gray-300"
                onClick={() => setActionsCollapsed(true)}
                title="Panel einklappen"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
            
            <div className="p-6">
              <h1 className="text-xl font-semibold mb-6">Actions</h1>
          
          {/* Main Tabs */}
          <div className="mb-6 space-y-1">
            <div 
              className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${currentTab === 'mandanten' ? 'bg-gray-200' : ''}`} 
              onClick={() => handleTabChange('mandanten')}
            >
              <div className="flex items-center">
                <Users size={18} className="mr-3 text-gray-600" />
                <span className="text-gray-700">Mandanten</span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">In Arbeit</span>
            </div>
            <div 
              className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${currentTab === 'chat' ? 'bg-gray-200' : ''}`} 
              onClick={() => handleTabChange('chat')}
            >
              <div className="flex items-center">
                <MessageSquare size={18} className="mr-3 text-gray-600" />
                <span className="text-gray-700">Chat</span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">In Arbeit</span>
            </div>
          </div>
          
          {/* Abteilung Section */}
          <div>
            <h2 className="text-gray-400 text-sm mb-2">Abteilung</h2>
            <div className="space-y-1">
              <div 
                className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${currentTab === 'backoffice' ? 'bg-gray-200' : ''}`} 
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
                  className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${currentTab === 'sales' ? 'bg-gray-200' : ''}`} 
                  onClick={() => handleTabChange('sales')}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <Phone size={18} className="text-gray-600" />
                    </div>
                    <span className="text-gray-700">Sales</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mr-2">In Arbeit</span>
                    {expandedSales ? 
                      <ChevronUp size={18} className="text-gray-400" /> : 
                      <ChevronDown size={18} className="text-gray-400" />
                    }
                  </div>
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
                        className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${currentTab === 'power-dialer' ? 'bg-gray-200' : ''}`} 
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
        </div>
        
        {/* Right Content Area - Clean without borders */}
        <div className="flex-1 p-6">
          <div className="bg-white h-full overflow-auto">
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