import React, { useState } from 'react';
import { CycloParams } from './types';
import { DEFAULT_PARAMS } from './constants';
import Controls from './components/Controls';
import Visualizer from './components/Visualizer';
import AIAssistant from './components/AIAssistant';
import { generateCycloidProfile, generatePinPoints } from './utils/geometry';
import { generateDXF } from './utils/dxf';
import { Play, Download, Settings, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [params, setParams] = useState<CycloParams>(DEFAULT_PARAMS);
  const [showAI, setShowAI] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'tolerance'>('standard');

  const handleDownload = () => {
    const profilePoints = generateCycloidProfile(params);
    const pinPoints = generatePinPoints(params); // Normally pins are separate parts, but useful for ref.
    const dxfContent = generateDXF(profilePoints, pinPoints, params);
    
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cycloid_drive_${params.pinCount}pins.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-80 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-2xl">
        <div className="p-5 border-b border-slate-800 bg-slate-900">
          <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            CycloGen Pro
          </h1>
          <p className="text-xs text-slate-500 mt-1">Parametric Design Tool</p>
        </div>
        <Controls 
            params={params} 
            onChange={setParams} 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            className="flex-1" 
        />
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => setAnimate(!animate)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${animate ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Play size={16} className={animate ? "fill-current" : ""} />
            {animate ? 'Stop Simulation' : 'Simulate Motion'}
          </button>
          <button 
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20"
          >
            <Download size={16} />
            Export DXF
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 relative flex flex-col">
        {/* Toolbar Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
             <div className="pointer-events-auto">
                 {/* Place for breadcrumbs or status if needed */}
             </div>
             <div className="pointer-events-auto flex gap-2">
                 <button 
                    onClick={() => setShowAI(!showAI)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all shadow-lg ${showAI ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                 >
                    <BrainCircuit size={18} />
                    AI Assistant
                 </button>
             </div>
        </div>

        <div className="flex-1 min-h-0">
             <Visualizer 
                params={params} 
                animate={animate} 
                viewMode={viewMode}
             />
        </div>
      </div>

      {/* Right AI Panel */}
      {showAI && (
        <div className="w-96 bg-slate-900 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 z-20">
           <AIAssistant params={params} onApplyParameters={setParams} />
        </div>
      )}
    </div>
  );
};

export default App;