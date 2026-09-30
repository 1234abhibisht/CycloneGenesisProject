import { useEffect, useState } from 'react';
import { 
  RadioTower, Send, ShieldCheck, Siren, Users, 
  MapPinned, MessageSquareWarning, Building2, 
  Copy, PhoneCall, Globe2, AlertOctagon, ChevronRight
} from 'lucide-react';
import { fetchEvacuationPlan, fetchSmsAlerts } from '../services/api';
import { useCyclone } from '../hooks/useCyclone';
import { Link } from 'react-router-dom';

interface EvacuationDistrict {
  districtId: string;
  districtName: string;
  state: string;
  distanceToLandfallKm: number;
  warningLevel: string;
  isWithin50kmCore: boolean;
  targetEvacuees: number;
  sheltersAllocated: number;
  transportBusesNeeded: number;
  priority: string;
  safeShelterHubs: string[];
}

interface EvacuationPlanData {
  status: number;
  policyMandate: string;
  totalEvacueesTarget: number;
  totalSheltersRequired: number;
  ndrfBattalionsRecommended: number;
  stagingTimeline: Array<{ phase: string; zone: string; action: string }>;
  districts: EvacuationDistrict[];
}

interface SmsAlertsData {
  status: number;
  stormName: string;
  alertTier: string;
  multilingualAlerts: Record<string, string>;
  disseminationChannels: string[];
  emergencyHelplines: Record<string, string>;
}

export default function EmergencyResponseConsole() {
  const { cyclone } = useCyclone();
  const stormId = cyclone?.id || 'ACTIVE';

  const [evacPlan, setEvacPlan] = useState<EvacuationPlanData | null>(null);
  const [smsData, setSmsData] = useState<SmsAlertsData | null>(null);
  const [activeLang, setActiveLang] = useState<string>('english');
  const [copied, setCopied] = useState<boolean>(false);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CORE_50KM' | 'RED_ALERT'>('CORE_50KM');

  useEffect(() => {
    let active = true;
    async function loadData() {
      const plan = await fetchEvacuationPlan(stormId);
      if (active && plan) setEvacPlan(plan);

      const sms = await fetchSmsAlerts(stormId);
      if (active && sms) setSmsData(sms);
    }
    loadData();
    return () => { active = false; };
  }, [stormId]);

  const copySms = () => {
    if (smsData?.multilingualAlerts?.[activeLang]) {
      navigator.clipboard.writeText(smsData.multilingualAlerts[activeLang]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const dispatchBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  const totalEvacuees = evacPlan?.totalEvacueesTarget || 342500;
  const totalShelters = evacPlan?.totalSheltersRequired || 286;
  const ndrfBattalions = evacPlan?.ndrfBattalionsRecommended || 8;
  const rawDistricts: EvacuationDistrict[] = evacPlan?.districts?.length ? evacPlan.districts : [
    {
      districtId: 'd-puri',
      districtName: 'Puri',
      state: 'Odisha',
      distanceToLandfallKm: 18.5,
      warningLevel: 'RED',
      isWithin50kmCore: true,
      targetEvacuees: 185000,
      sheltersAllocated: 154,
      transportBusesNeeded: 1480,
      priority: 'IMMEDIATE_URGENT',
      safeShelterHubs: ['Puri Town Multipurpose Cyclone Shelter', 'Gop Block High School Hub', 'Brahmagiri Community Shelter']
    },
    {
      districtId: 'd-jagatsinghpur',
      districtName: 'Jagatsinghpur',
      state: 'Odisha',
      distanceToLandfallKm: 34.2,
      warningLevel: 'RED',
      isWithin50kmCore: true,
      targetEvacuees: 98000,
      sheltersAllocated: 82,
      transportBusesNeeded: 784,
      priority: 'IMMEDIATE_URGENT',
      safeShelterHubs: ['Paradip Port Disaster Shelter', 'Erasama Flood Center', 'Kujang Model College']
    },
    {
      districtId: 'd-kendrapara',
      districtName: 'Kendrapara',
      state: 'Odisha',
      distanceToLandfallKm: 46.8,
      warningLevel: 'ORANGE',
      isWithin50kmCore: true,
      targetEvacuees: 59500,
      sheltersAllocated: 50,
      transportBusesNeeded: 476,
      priority: 'IMMEDIATE_URGENT',
      safeShelterHubs: ['Aul Multi-purpose Shelter', 'Rajnagar Community Shelter']
    },
    {
      districtId: 'd-bhadrak',
      districtName: 'Bhadrak',
      state: 'Odisha',
      distanceToLandfallKm: 68.2,
      warningLevel: 'ORANGE',
      isWithin50kmCore: false,
      targetEvacuees: 32000,
      sheltersAllocated: 28,
      transportBusesNeeded: 256,
      priority: 'SECONDARY_WATCH',
      safeShelterHubs: ['Chandbali Block Shelter', 'Dhamra Port Safety Hub']
    }
  ];

  const filteredDistricts = rawDistricts.filter(d => {
    if (selectedFilter === 'CORE_50KM') return d.isWithin50kmCore;
    if (selectedFilter === 'RED_ALERT') return d.warningLevel === 'RED';
    return true;
  });

  const languages = [
    { key: 'english', label: 'English' },
    { key: 'hindi', label: 'हिंदी (Hindi)' },
    { key: 'odia', label: 'ଓଡ଼ିଆ (Odia)' },
    { key: 'bengali', label: 'বাংলা (Bengali)' },
    { key: 'telugu', label: 'తెలుగు (Telugu)' },
    { key: 'gujarati', label: 'ગુજરાતી (Gujarati)' }
  ];

  const currentAlertText = smsData?.multilingualAlerts?.[activeLang] || 
    `URGENT DISASTER ALERT [NDMA/IMD]: Severe Cyclone approaching coastal sector in 24h with winds >140km/h and 3.5m tidal surge. Pre-emptive evacuation ordered for all low-lying areas within 50 km coastal zone. Move to designated cyclone shelter immediately. Helpline: 1070.`;

  return (
    <div className="max-w-[1750px] mx-auto space-y-6 text-slate-100 pb-12">
      
      {/* Figma Stitch Hero Console Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-[#071326] to-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
              <RadioTower className="w-3.5 h-3.5" />
              SIH Problem Statement 26070 • Action Directives 4 & 5
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>Incident Response & 50 km Evacuation Orchestrator</span>
              <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold animate-pulse">
                ZONE DIRECTIVE LIVE
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Design preview only — logistics and dissemination below are placeholders, not backend results. Fusing multi-sensor satellite eye fixes with <b>staged 50 km pre-emptive evacuation logistics</b> and <b>automated multi-lingual cell broadcast dissemination</b> (CAP-v1.2).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Link 
              to="/dashboard/sdg"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Globe2 className="w-4 h-4" />
              <span>View SDG 13 & 11 Impact Metrics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            
            <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs backdrop-blur flex items-center justify-between gap-4">
              <span className="text-slate-400 font-medium">Standard Protocol:</span>
              <span className="font-bold text-cyan-400">NDMA / IMD CAP-v1.2</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modern KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase tracking-wide">
              50 km Swath
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-3">Target Evacuees</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-white">{totalEvacuees.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">citizens</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Census-derived vulnerable coastal population</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-wide">
              1,200 Cap/Hub
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-3">Shelters Allocated</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-cyan-400">{totalShelters}</span>
            <span className="text-xs text-slate-400 font-medium">multi-purpose hubs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Geo-tagged cyclone centers & safe schools</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wide">
              Force Multiplier
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-3">NDRF / SDRF Quota</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-amber-400">{ndrfBattalions}</span>
            <span className="text-xs text-slate-400 font-medium">specialized battalions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Deployed with inflatable boats & clearing gear</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 uppercase tracking-wide">
              Mandatory
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-3">Clearance Deadline</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-red-400">T-12h</span>
            <span className="text-xs text-slate-400 font-medium">pre-landfall</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Complete movement before 65 km/h squalls</p>
        </div>

      </div>

      {/* Main Orchestration Workstation Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Coastal District Logistics Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur space-y-5">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPinned className="w-5 h-5 text-cyan-400" />
                  Coastal Threat Swath Breakdown
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time distance calculation from projected cyclone eye landfall fix.
                </p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setSelectedFilter('CORE_50KM')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    selectedFilter === 'CORE_50KM' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  50 km Core ({rawDistricts.filter(d => d.isWithin50kmCore).length})
                </button>
                <button
                  onClick={() => setSelectedFilter('RED_ALERT')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    selectedFilter === 'RED_ALERT' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Red Alert
                </button>
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    selectedFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Sectors
                </button>
              </div>
            </div>

            {/* District Cards Stream */}
            <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredDistricts.map((d) => (
                <div 
                  key={d.districtId} 
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 space-y-3.5 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${d.warningLevel === 'RED' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                      <h3 className="font-bold text-base text-white">{d.districtName}, {d.state}</h3>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {d.distanceToLandfallKm} km to eye
                      </span>
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                      d.isWithin50kmCore 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {d.isWithin50kmCore ? 'PRIORITY 1 CORE' : 'BUFFER WATCH'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Target Evacuees:</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">{d.targetEvacuees.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Shelters Needed:</span>
                      <span className="text-sm font-bold text-cyan-400 mt-0.5 block">{d.sheltersAllocated} hubs</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Bus Quota:</span>
                      <span className="text-sm font-bold text-amber-400 mt-0.5 block">{d.transportBusesNeeded} vehicles</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 font-medium">Designated Shelter Facilities:</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {d.safeShelterHubs.map((hub, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                          • {hub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Staging Timeline Strip */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Staged Evacuation Sequence (Sundarban & Yaas Operational Model)
              </span>
              <div className="grid sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/30">
                  <span className="font-bold text-red-400 block">Phase 1: 0 - 15 km</span>
                  <span className="text-slate-300 text-[11px] block mt-0.5">Thatched homes, elderly, livestock transit (T-24h to T-18h)</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/30">
                  <span className="font-bold text-amber-400 block">Phase 2: 15 - 35 km</span>
                  <span className="text-slate-300 text-[11px] block mt-0.5">Mandatory bus transit to high schools (T-18h to T-12h)</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/30">
                  <span className="font-bold text-cyan-400 block">Phase 3: 35 - 50 km</span>
                  <span className="text-slate-300 text-[11px] block mt-0.5">Grid power isolation & total lockdown (T-12h to T-6h)</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column (5 cols): Multi-Lingual SMS Warning Dispatcher */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur space-y-5 flex flex-col justify-between h-full">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquareWarning className="w-5 h-5 text-amber-400" />
                    Multi-Lingual Alert Broadcast
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Standardized CAP-v1.2 Emergency Push Generator
                  </p>
                </div>
                <Globe2 className="w-5 h-5 text-cyan-400" />
              </div>

              {/* Language Selector Strip */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Target Language:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l) => (
                    <button
                      key={l.key}
                      onClick={() => setActiveLang(l.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        activeLang === l.key 
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' 
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Siren className="w-4 h-4" /> CELL BROADCAST LIVE PREVIEW
                  </span>
                  <span>{currentAlertText.length} Chars</span>
                </div>
                
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-100 leading-relaxed select-all">
                  {currentAlertText}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400 text-[11px]">Channel: CAP-v1.2 Emergency Gateway</span>
                  <button
                    onClick={copySms}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy Alert Text'}
                  </button>
                </div>
              </div>

              {/* Emergency Helpline Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  Embedded Emergency Helplines:
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">National</span>
                    <span className="font-bold text-white text-sm">1070</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">State Control</span>
                    <span className="font-bold text-white text-sm">1077</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ERSS / Police</span>
                    <span className="font-bold text-white text-sm">112</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Ambulance</span>
                    <span className="font-bold text-white text-sm">108</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Broadcast Dispatch Button */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                disabled title="No broadcast delivery service is configured" onClick={dispatchBroadcast}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 p-4 text-sm font-bold text-white shadow-xl shadow-red-500/20 transition active:scale-[0.99] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {broadcastSent ? 'Delivery unavailable' : 'Delivery not configured — preview only'}
              </button>
              <p className="text-center text-[10px] text-slate-500">
                Simulates real-time gateway push conforming to ITU-T X.1303 & C-DOT Cell Broadcast specifications.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

