import { useState, useEffect } from 'react';
import { Cpu, BarChart2, Target, Sparkles, Activity } from 'lucide-react';
import { ModelComparisonChart } from '../components/charts/ModelComparisonChart';
import { SHAPChart } from '../components/charts/SHAPChart';
import { TrainingMetricsChart } from '../components/charts/TrainingMetricsChart';
import { DataSourceTag } from '../components/ui/DataSourceTag';
import { fetchModelPerformance } from '../services/api';

export default function ModelPerformance() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'shap' | 'training'>('comparison');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const perfData = await fetchModelPerformance();
        setData(perfData);
      } catch (err) {
        console.error("Failed to load model performance data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full h-full text-slate-100 bg-[#0a0f1e] overflow-y-auto p-6 md:p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 animate-fade-in-up"
        style={{ animationDelay: '0ms' }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Cpu className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Model Performance
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-3 h-3" /> Evaluation Suite
              </span>
            </div>
            <p className="text-slate-400 mt-1 text-base lg:text-lg">
              Transparent evaluation metrics, baseline benchmarking, and explainable AI insights
            </p>
          </div>
        </div>
        <div className="self-end sm:self-center">
          {data ? <DataSourceTag source="MODEL" /> : <span>Unavailable</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-px mb-2">
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'comparison' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Model Comparison
          {activeTab === 'comparison' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />}
        </button>
        <button
          onClick={() => setActiveTab('shap')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'shap' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Feature Importance (SHAP)
          {activeTab === 'shap' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />}
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'training' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Training History
          {activeTab === 'training' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-8 animate-pulse">
          <div className="h-96 bg-slate-800/50 rounded-2xl border border-slate-700/80"></div>
          <div className="h-64 bg-slate-800/50 rounded-2xl border border-slate-700/80"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {activeTab === 'comparison' && (
            <>
              <div 
                className="bg-slate-800/50 rounded-2xl border border-slate-700/80 p-6 lg:p-7 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-slate-600 transition-all duration-300 backdrop-blur-sm animate-fade-in-up"
                style={{ animationDelay: '100ms' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                      <Target className="w-5 h-5 text-cyan-400" />
                    </div>
                    Track & Intensity Model Comparison
                  </h2>
                </div>
                <div className="h-80 w-full mb-6">
                  {data?.metrics ? <div className="overflow-auto"><p>Saved XGBoost evaluation · retrospective +24h prediction</p><table className="w-full text-left mt-5"><thead><tr><th>Split</th><th>Wind MAE (kt)</th><th>Track error (km)</th></tr></thead><tbody>{['train','validation','test'].map(split => <tr key={split}><td className="py-3">{split}</td><td>{data.metrics.intensity[split].mae_knots.toFixed(2)}</td><td>{data.metrics.track[split].mean_error_km.toFixed(2)}</td></tr>)}</tbody></table></div> : data?.comparison ? <ModelComparisonChart data={data.comparison} height={320} /> : <p>Evaluation data unavailable.</p>}
                </div>
              </div>
            </>
          )}

          {activeTab === 'shap' && (
            <div 
              className="bg-slate-800/50 rounded-2xl border border-slate-700/80 p-6 lg:p-7 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-slate-600 transition-all duration-300 backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <BarChart2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  Feature Importance (SHAP Values)
                </h2>
              </div>
              <p className="text-slate-400 text-sm mb-6">SHAP values indicating feature importance weights across models.</p>
              <div className="h-96 w-full">
                {data?.shapFeatures ? <SHAPChart features={data.shapFeatures} height={384} /> : <p>No computed SHAP artifact is available for these models.</p>}
              </div>
            </div>
          )}

          {activeTab === 'training' && (
            <div 
              className="bg-slate-800/50 rounded-2xl border border-slate-700/80 p-6 lg:p-7 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-slate-600 transition-all duration-300 backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  Training & Validation History
                </h2>
              </div>
              <div className="h-96 w-full">
                {data?.trainingHistory ? <TrainingMetricsChart data={data.trainingHistory} height={384} /> : <p>Epoch training history is unavailable. Measured split results are shown in Model Comparison.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

