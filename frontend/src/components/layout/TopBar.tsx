import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { fetchBackendStatus, type BackendStatus } from '../../services/api';
export const TopBar = ({title,onRefresh}:{title:string;lastUpdated?:string;onRefresh?:()=>void}) => {
 const [status,setStatus]=useState<BackendStatus|null>(null);
 const navigate=useNavigate();
 const load=async()=>setStatus(await fetchBackendStatus());
 useEffect(()=>{void load();},[]);
 return <header className="observatory-topbar"><div><span className="topbar-title">{title}</span><span className="topbar-state">{status ? 'Live workspace' : 'Data service unavailable'}</span></div><div className="topbar-actions"><button className="tour-button" onClick={()=>{const routes=['command','live','basin','forecast','warnings','historical','test-strike','models','system'];const current=window.location.pathname.split('/').pop()||'command';navigate(`/dashboard/${routes[(routes.indexOf(current)+1)%routes.length]}`);}}>Next workspace <ArrowRight size={13}/></button><button className="refresh-button" aria-label="Refresh workspace" onClick={()=>{void load();onRefresh?.();}}><RefreshCw size={15}/></button></div></header>;
};
