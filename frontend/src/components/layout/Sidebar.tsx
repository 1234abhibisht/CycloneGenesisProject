import type { ComponentType } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Radio, Waves, TrendingUp, Bell, History, Database, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';
type NavIcon = ComponentType<{ size?: number; strokeWidth?: number }>;
const sections: { title: string; items: [string, string, NavIcon][] }[] = [
  {title:'MONITOR',items:[['command','Overview',Compass],['live','Live monitoring',Radio],['basin','Basin watch',Waves]]},
  {title:'ANALYSE',items:[['forecast','Forecast (6-24 h)',TrendingUp],['warnings','District strike risk',Bell]]},
  {title:'RESEARCH',items:[['historical','Test-storm replay',History],['models','Model performance',Gauge],['system','Data & sources',Database]]}
];
export const Sidebar = ({isCollapsed,onToggle}:{isCollapsed:boolean;onToggle:()=>void}) => {
 const {pathname}=useLocation();
 return <aside className={`observatory-sidebar ${isCollapsed?'is-collapsed':''}`}><NavLink className="observatory-brand" to="/dashboard/command"><Compass size={30} strokeWidth={1.4}/>{!isCollapsed&&<span>Cyclone<span className="brand-ai">AI</span><small>THE BASIN OBSERVATORY</small></span>}</NavLink><nav aria-label="Main navigation">{sections.map(s=><div className="nav-section" key={s.title}>{!isCollapsed&&<p>{s.title}</p>}{s.items.map(([path,label,Icon])=><NavLink key={path} to={`/dashboard/${path}`} title={label} aria-label={isCollapsed?label:undefined} className={({isActive})=>`observatory-nav ${isActive||path==='command'&&['/','/dashboard'].includes(pathname)?'selected':''}`}><Icon size={18} strokeWidth={1.6}/>{!isCollapsed&&<span>{label}</span>}</NavLink>)}</div>)}</nav><div className="sidebar-bottom">{!isCollapsed&&<p>Built for a changing coast.<small>North Indian Ocean research</small></p>}<button onClick={onToggle} aria-label={isCollapsed?'Expand navigation':'Collapse navigation'}>{isCollapsed?<ChevronRight size={17}/>:<ChevronLeft size={17}/>}</button></div></aside>;
};
