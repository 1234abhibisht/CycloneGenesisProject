import { useState } from 'react';
import { Database, Server, Cpu, Globe, Activity, HardDrive, Network, Map, Code, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const architectureNodes = [
  { id: 'ibtracs', title: 'IBTrACS', icon: Database, row: 1, desc: 'Provides 40+ years of historical cyclone records from NOAA.' },
  { id: 'era5', title: 'ERA5', icon: Activity, row: 1, desc: 'Atmospheric reanalysis data from ECMWF.' },
  { id: 'gibs', title: 'Satellite GIBS', icon: Globe, row: 1, desc: 'NASA GIBS WMTS tile service for real-time imagery.' },
  { id: 'livetrack', title: 'Live Track Data', icon: Network, row: 1, desc: 'Real-time operational data from IMD and JTWC.' },
  { id: 'ingestion', title: 'Data Ingestion & Processing Pipeline', icon: Server, row: 2, desc: 'Python-based ETL pipeline fetching and transforming multi-source data.' },
  { id: 'postgres', title: 'PostgreSQL + PostGIS', icon: HardDrive, row: 3, desc: 'Relational database with PostGIS spatial extension.' },
  { id: 'ml', title: 'ML Models', icon: Cpu, row: 4, desc: 'Track prediction (LSTM+Attention), intensity forecasting (XGBoost).' },
  { id: 'spatial', title: 'Spatial Engine', icon: Map, row: 4, desc: 'PostGIS spatial queries for district risk assessment.' },
  { id: 'api', title: 'FastAPI Backend', icon: Code, row: 5, desc: 'RESTful API with WebSocket support for real-time updates.' },
  { id: 'react', title: 'React Dashboard', icon: LayoutDashboard, row: 6, desc: 'TypeScript React application with Leaflet, Recharts, and Tailwind CSS.' },
];

const dbSchemas = [
  { name: 'cyclones', cols: [{ n: 'cyclone_id', t: 'pk' }, { n: 'name', t: 'varchar' }, { n: 'basin', t: 'varchar' }, { n: 'start_date', t: 'timestamp' }, { n: 'max_wind', t: 'float' }] },
  { name: 'track_points', cols: [{ n: 'track_id', t: 'pk' }, { n: 'cyclone_id', t: 'fk' }, { n: 'timestamp', t: 'timestamp' }, { n: 'lat', t: 'float' }, { n: 'lon', t: 'float' }, { n: 'geometry', t: 'geom' }] },
  { name: 'environmental_data', cols: [{ n: 'env_id', t: 'pk' }, { n: 'timestamp', t: 'timestamp' }, { n: 'sst', t: 'float' }, { n: 'wind_shear', t: 'float' }, { n: 'geometry', t: 'geom' }] },
  { name: 'predictions', cols: [{ n: 'pred_id', t: 'pk' }, { n: 'cyclone_id', t: 'fk' }, { n: 'pred_lat', t: 'float' }, { n: 'pred_lon', t: 'float' }, { n: 'uncertainty', t: 'float' }, { n: 'geometry', t: 'geom' }] },
  { name: 'districts', cols: [{ n: 'district_id', t: 'pk' }, { n: 'name', t: 'varchar' }, { n: 'state', t: 'varchar' }, { n: 'geometry', t: 'geom' }] },
  { name: 'prediction_logs', cols: [{ n: 'log_id', t: 'pk' }, { n: 'cyclone_id', t: 'fk' }, { n: 'model_version', t: 'varchar' }, { n: 'status', t: 'varchar' }] },
];

const apiEndpoints = [
  { method: 'GET', path: '/api/cyclones/active', desc: 'Fetch currently active cyclones' },
  { method: 'GET', path: '/api/cyclones/{id}', desc: 'Get specific cyclone details' },
  { method: 'GET', path: '/api/cyclones/{id}/track', desc: 'Get track points for a cyclone' },
  { method: 'GET', path: '/api/cyclones/{id}/prediction', desc: 'Get model predictions' },
  { method: 'GET', path: '/api/historical/similar/{id}', desc: 'Find historically similar tracks' },
  { method: 'GET', path: '/api/risk/districts', desc: 'Assess risk for coastal districts' },
];

const SystemArchitecture = () => {
  const [selectedNode, setSelectedNode] = useState(architectureNodes[0]);

  const renderNode = (node: typeof architectureNodes[0]) => (
    <div
      key={node.id}
      onClick={() => setSelectedNode(node)}
      className={cn(
        "cursor-pointer bg-slate-800/80 border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[100px]",
        selectedNode.id === node.id 
          ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-slate-800" 
          : "border-slate-600 hover:border-cyan-500/50 hover:bg-slate-700/80"
      )}
    >
      <node.icon className={cn("mb-2", selectedNode.id === node.id ? "text-cyan-400" : "text-slate-400")} size={28} />
      <span className="text-sm font-medium">{node.title}</span>
    </div>
  );

  return (
    <div className="flex flex-col space-y-8 h-full overflow-y-auto p-4 md:p-6 text-slate-100 bg-[#0a0f1e]">
      <header>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">System Architecture</h1>
        <p className="text-slate-400 text-sm">Interactive platform architecture and component overview</p>
      </header>

      {/* Interactive Architecture Flowchart */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-grow bg-slate-900/50 border border-slate-700 rounded-xl p-6 relative overflow-x-auto">
          <div className="min-w-[700px] flex flex-col space-y-8 relative">
            {/* Row 1 */}
            <div className="grid grid-cols-4 gap-4 z-10">
              {architectureNodes.filter(n => n.row === 1).map(renderNode)}
            </div>
            
            {/* Arrows 1 -> 2 */}
            <div className="flex justify-center -my-4 relative z-0">
               <div className="h-8 border-l border-dashed border-cyan-500/50 mx-auto"></div>
            </div>

            {/* Row 2 */}
            <div className="flex justify-center z-10">
              <div className="w-1/2">
                {architectureNodes.filter(n => n.row === 2).map(renderNode)}
              </div>
            </div>

            {/* Arrows 2 -> 3 */}
            <div className="flex justify-center -my-4 relative z-0">
               <div className="h-8 border-l border-dashed border-cyan-500/50 mx-auto"></div>
            </div>

            {/* Row 3 */}
            <div className="flex justify-center z-10">
              <div className="w-1/3">
                {architectureNodes.filter(n => n.row === 3).map(renderNode)}
              </div>
            </div>

            {/* Arrows 3 -> 4 */}
            <div className="flex justify-center -my-4 relative z-0 space-x-32">
               <div className="h-8 border-l border-dashed border-cyan-500/50"></div>
               <div className="h-8 border-l border-dashed border-cyan-500/50"></div>
            </div>

            {/* Row 4 */}
            <div className="flex justify-center space-x-8 z-10">
              <div className="w-1/3">
                {architectureNodes.filter(n => n.id === 'ml').map(renderNode)}
              </div>
              <div className="w-1/3">
                {architectureNodes.filter(n => n.id === 'spatial').map(renderNode)}
              </div>
            </div>

            {/* Arrows 4 -> 5 */}
            <div className="flex justify-center -my-4 relative z-0">
               <div className="h-8 border-l border-dashed border-cyan-500/50 mx-auto"></div>
            </div>

            {/* Row 5 */}
            <div className="flex justify-center z-10">
              <div className="w-1/3">
                {architectureNodes.filter(n => n.row === 5).map(renderNode)}
              </div>
            </div>

            {/* Arrows 5 -> 6 */}
            <div className="flex justify-center -my-4 relative z-0">
               <div className="h-8 border-l border-dashed border-cyan-500/50 mx-auto"></div>
            </div>

            {/* Row 6 */}
            <div className="flex justify-center z-10">
              <div className="w-1/2">
                {architectureNodes.filter(n => n.row === 6).map(renderNode)}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Node Details */}
        <div className="lg:w-80 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col items-center text-center">
           <selectedNode.icon className="text-cyan-400 mb-4" size={48} />
           <h3 className="text-xl font-bold mb-2 text-slate-100">{selectedNode.title}</h3>
           <p className="text-slate-400 text-sm">{selectedNode.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Database Schema Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Database Design</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbSchemas.map(schema => (
              <div key={schema.name} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-2">{schema.name}</h3>
                <ul className="text-xs space-y-1 font-mono">
                  {schema.cols.map(col => (
                    <li key={col.n} className="flex justify-between">
                      <span className={cn(
                        col.t === 'pk' ? "text-cyan-400 font-bold" :
                        col.t === 'fk' ? "text-amber-400" :
                        col.t === 'geom' ? "text-emerald-400" : "text-slate-400"
                      )}>{col.n}</span>
                      <span className="text-slate-500">{col.t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* API Endpoints Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">API Architecture</h2>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map((ep, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">{ep.method}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-400/90 text-xs">{ep.path}</td>
                    <td className="px-4 py-3 text-xs">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemArchitecture;
