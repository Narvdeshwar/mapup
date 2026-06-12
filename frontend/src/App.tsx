import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Dashboard from './pages/Dashboard';
import Geofences from './pages/Geofences';
import Vehicles from './pages/Vehicles';
import Alerts from './pages/Alerts';
import History from './pages/History';

import { cn } from './lib/utils';
import { MapIcon, RadarIcon, TruckIcon, BellIcon, HistoryIcon, SettingsIcon, UserIcon, MapPinIcon } from 'lucide-react';

const queryClient = new QueryClient();

function SidebarLink({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors outline-none",
        isActive 
          ? "bg-slate-100 text-slate-900" 
          : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 focus-visible:ring-1 focus-visible:ring-slate-300"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-slate-800" : "text-slate-400")} />
      {children}
    </Link>
  );
}

function Sidebar() {
  return (
    <aside className="w-56 border-r border-slate-200 bg-[#FBFBFC] hidden md:flex flex-col shrink-0 relative z-20">
      {/* Brand Header */}
      <div className="h-12 flex items-center px-4 border-b border-slate-200/60 bg-white shrink-0">
        <div className="flex items-center gap-2 w-full">
          <div className="bg-slate-900 p-1 rounded shadow-sm">
            <MapIcon className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-[13px] tracking-tight text-slate-900 flex-1">MapUp</span>
          <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/60 uppercase tracking-wider">Pro</span>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-6">
        <div className="space-y-0.5">
          <SidebarLink to="/" icon={RadarIcon}>Live Map</SidebarLink>
          <SidebarLink to="/geofences" icon={MapPinIcon}>Geofences</SidebarLink>
          <SidebarLink to="/vehicles" icon={TruckIcon}>Fleet Hub</SidebarLink>
        </div>

        <div className="space-y-0.5">
          <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 select-none">Automations</p>
          <SidebarLink to="/alerts" icon={BellIcon}>Alert Rules</SidebarLink>
          <SidebarLink to="/history" icon={HistoryIcon}>Audit Log</SidebarLink>
        </div>
      </div>

      {/* Footer Profile/Settings */}
      <div className="p-3 border-t border-slate-200/60 space-y-0.5 bg-white shrink-0">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-slate-300">
          <SettingsIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          Workspace Settings
        </button>
        <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-slate-300">
          <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          Account
        </button>
      </div>
    </aside>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen w-full bg-white font-sans text-slate-900 overflow-hidden antialiased selection:bg-slate-200 selection:text-slate-900">
          <Sidebar />
          <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-white">
            {/* Topbar Breadcrumb */}
            <header className="h-12 border-b border-slate-200 flex items-center px-6 shrink-0 bg-white z-10 sticky top-0">
               <div className="text-[13px] font-medium text-slate-500 flex items-center gap-2">
                 MapUp <span className="text-slate-300">/</span> <span className="text-slate-900">Production Workspace</span>
               </div>
            </header>
            
            <div className="flex-1 overflow-auto p-6 lg:p-8 w-full max-w-[1200px] mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/geofences" element={<Geofences />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </div>
          </main>
          <ToastContainer position="bottom-right" theme="light" toastClassName="text-[13px] font-medium shadow-lg border border-slate-200 rounded-lg" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
