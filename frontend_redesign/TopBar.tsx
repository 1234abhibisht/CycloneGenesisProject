import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { fetchBackendStatus, switchOperationalMode, type BackendStatus } from '../../services/api';
export const TopBar = ({title,onRefresh}:{title:string;lastUpdated?:string;onRefresh?:()=>void}) => {
 const [status,setStatus]=useState<BackendStatus|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const navigate=useNavigate();
 const load=async()=>setStatus(await fetchBackendStatus());
 useEffect(()=>{void load();},[]);
 const change=async(mode:'live'|'replay')=>{setBusy(true);setError('');try{if(await switchOperationalMode(mode)){await load();onRefresh?.();}else setError('Mode could not be changed. Check the data service.');}catch{setError('Mode could not be changed.');}finally{setBusy(false);}};
 return <header className="observatory-topbar"><div><span className="topbar-title">{title}</span><span className="topbar-state">{status ? `${status.operational_mode==='replay'?'Replay':'Live'} workspace` : 'Data service unavailable'}</span></div><div className="topbar-actions"><div className="mode-switch" aria-label="Data mode">{(['live','replay'] as const).map(mode=><button key={mode} disabled={busy||!status} aria-pressed={status?.operational_mode===mode} onClick={()=>change(mode)}>{mode==='live'?'Live':'Replay'}</button>)}</div><button className="tour-button" onClick={()=>{const routes=['command','live','forecast','warnings','historical','system'];const current=window.location.pathname.split('/').pop()||'command';navigate(`/dashboard/${routes[(routes.indexOf(current)+1)%routes.length]}`);}}>Next workspace <ArrowRight size={13}/></button><button className="refresh-button" aria-label="Refresh workspace" onClick={()=>{void load();onRefresh?.();}}><RefreshCw size={15}/></button></div>{error&&<span role="alert" className="mode-error">{error}</span>}</header>;
};
