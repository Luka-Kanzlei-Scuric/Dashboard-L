import React, { useState } from 'react';
import { LayoutGridIcon, HomeIcon, LineChartIcon, CircleIcon, BriefcaseIcon, SettingsIcon, UsersIcon, MessageSquareIcon, BuildingIcon, PhoneIcon, PhoneCallIcon, ChevronUpIcon, ChevronDownIcon, ChevronRightIcon, RotateCwIcon } from 'lucide-react';
export function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedSales, setExpandedSales] = useState(false);
  return <div className="flex h-screen bg-white">
      {/* Black Sidebar */}
      <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 rounded-r-lg">
        <div className="mb-10">
          <LayoutGridIcon className="text-white" size={24} />
        </div>
        <div className="flex flex-col items-center space-y-8 flex-1">
          <HomeIcon className="text-gray-400 hover:text-white cursor-pointer" size={20} />
          <div className="bg-zinc-700 p-2 rounded-md">
            <CircleIcon className="text-white cursor-pointer" size={20} />
          </div>
          <LineChartIcon className="text-gray-400 hover:text-white cursor-pointer" size={20} />
          <BriefcaseIcon className="text-gray-400 hover:text-white cursor-pointer" size={20} />
          <div className="flex-1"></div>
          <SettingsIcon className="text-gray-400 hover:text-white cursor-pointer" size={20} />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Panel - Grey/Light-blue Tab */}
        <div className="w-80 bg-gray-100 p-6 rounded-r-lg">
          <h1 className="text-xl font-semibold mb-6">Actions</h1>
          {/* Main Tabs */}
          <div className="mb-6 space-y-1">
            <div className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'mandanten' ? 'bg-gray-200' : ''}`} onClick={() => setActiveTab('mandanten')}>
              <div className="flex items-center">
                <UsersIcon size={18} className="mr-3 text-gray-600" />
                <span className="text-gray-700">Mandanten</span>
              </div>
            </div>
            <div className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'chat' ? 'bg-gray-200' : ''}`} onClick={() => setActiveTab('chat')}>
              <div className="flex items-center">
                <MessageSquareIcon size={18} className="mr-3 text-gray-600" />
                <span className="text-gray-700">Chat</span>
              </div>
            </div>
          </div>
          {/* Abteilung Section */}
          <div>
            <h2 className="text-gray-400 text-sm mb-2">Abteilung</h2>
            <div className="space-y-1">
              <div className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'backoffice' ? 'bg-gray-200' : ''}`} onClick={() => setActiveTab('backoffice')}>
                <div className="flex items-center">
                  <BuildingIcon size={18} className="mr-3 text-gray-600" />
                  <span className="text-gray-700">Backoffice</span>
                </div>
              </div>
              {/* Sales with subtabs */}
              <div>
                <div className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'sales' || expandedSales ? 'bg-gray-200' : ''}`} onClick={() => {
                setExpandedSales(!expandedSales);
                setActiveTab('sales');
              }}>
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <PhoneIcon size={18} className="text-gray-600" />
                    </div>
                    <span className="text-gray-700">Sales</span>
                  </div>
                  {expandedSales ? <ChevronUpIcon size={18} className="text-gray-400" /> : <ChevronDownIcon size={18} className="text-gray-400" />}
                </div>
                {/* Sales subtabs */}
                {expandedSales && <div className="relative ml-4 mt-1">
                    {/* Rounded connector line */}
                    <div className="absolute left-0 top-0 h-full">
                      <div className="absolute left-0 top-0 h-full w-4">
                        <div className="absolute left-0 top-0 h-full w-[1px] bg-gray-300"></div>
                        <div className="absolute left-0 top-0 h-4 w-4 border-l border-b rounded-bl-lg border-gray-300"></div>
                      </div>
                    </div>
                    {/* Subtab content */}
                    <div className="pl-4">
                      <div className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer hover:bg-gray-200 ${activeTab === 'power-dialer' ? 'bg-gray-200' : ''}`} onClick={e => {
                    e.stopPropagation();
                    setActiveTab('power-dialer');
                  }}>
                        <div className="flex items-center">
                          <PhoneCallIcon size={16} className="mr-3 text-gray-600" />
                          <span className="text-gray-700">Power-Dialer</span>
                        </div>
                        <ChevronRightIcon size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>}
              </div>
            </div>
          </div>
        </div>
        {/* Right Content Area - White with borders */}
        <div className="flex-1 p-6">
          <div className="bg-white h-full rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
            <div className="text-gray-400">Content will appear here</div>
          </div>
        </div>
      </div>
      {/* Refresh Button */}
      <button className="fixed bottom-6 right-6 bg-white rounded-full p-3 shadow-lg">
        <RotateCwIcon size={24} />
      </button>
    </div>;
}