import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, Radio, Cpu, BellRing, 
  History, Server, ChevronLeft, ChevronRight, Activity, Waves, RadioTower, Satellite, Globe2
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard/command', label: 'Command Center', icon: ShieldAlert, badge: null },
  { path: '/dashboard/live', label: 'Live Monitoring', icon: Radio, badge: { text: 'LIVE', color: 'bg-emerald-500 text-emerald-300' } },
  { path: '/dashboard/basin', label: 'Basin Watch', icon: Waves, badge: null },
  { path: '/dashboard/forecast', label: 'AI Forecast', icon: Cpu, badge: null },
  { path: '/dashboard/warnings', label: 'Warnings & Impact', icon: BellRing, badge: { text: '2 ACTIVE', color: 'bg-amber-500 text-amber-300' } },
  { path: '/dashboard/response', label: 'Response Console', icon: RadioTower, badge: { text: '50 KM', color: 'bg-red-500 text-red-300' } },
  { path: '/dashboard/satellite', label: 'Satellite Intelligence', icon: Satellite, badge: { text: 'NASA', color: 'bg-violet-500 text-violet-300' } },
  { path: '/dashboard/sdg', label: 'SDG Impact Engine', icon: Globe2, badge: { text: 'UN 2030', color: 'bg-emerald-500 text-emerald-300' } },
  { path: '/dashboard/historical', label: 'Historical Intelligence', icon: History, badge: null },
  { path: '/dashboard/system', label: 'System & Data Integrity', icon: Server, badge: { text: 'HEALTHY', color: 'bg-sky-500 text-sky-300' } },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <aside className={clsx(
      "hidden sm:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 select-none",
      isCollapsed ? "w-[68px]" : "w-[260px]"
    )}>
      {/* Brand Header */}
      <div className="flex items-center justify-between h-[72px] px-4 border-b border-slate-200 bg-white">
        <NavLink to="/dashboard/command" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <Activity className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-700 tracking-wide">Cyclone AI</span>
              <span className="text-[10px] text-slate-500 tracking-wide uppercase">Early warning workspace</span>
            </div>
          )}
        </NavLink>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
              isActive 
                ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 font-semibold" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <div className="flex items-center gap-3 min-w-0">
              <item.icon className="w-4 h-4 shrink-0 transition-colors" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </div>

            {!isCollapsed && item.badge && (
              <span className={clsx(
                "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight bg-opacity-20",
                item.badge.color
              )}>
                {item.badge.text}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Operational System Status Footer */}
      <div className="p-3 border-t border-[#1E3A5F]/60 bg-[#07111F]/40 space-y-2">
        {!isCollapsed && (
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between text-slate-800 text-[11px]">
              <span className="text-slate-500">SYSTEM STATUS</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
              <span>Last Sync:</span>
              <span className="text-slate-700">Ready</span>
            </div>
          </div>
        )}
        <button 
          onClick={onToggle}
          className="flex items-center justify-center w-full p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
