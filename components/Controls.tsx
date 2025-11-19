import React from 'react';
import { CycloParams } from '../types';
import { PRESETS, MANUFACTURING_PRESETS } from '../constants';
import { Info, Sliders, Circle, AlertTriangle, Bookmark, Wand2, CheckCircle2, ArrowRight, Settings2, ScanEye, Printer, Activity, Scale, Microscope, Zap, RotateCw, Move } from 'lucide-react';
import { getGeometricQuality, calculatePhysicsMetrics } from '../utils/geometry';

interface ControlsProps {
  params: CycloParams;
  onChange: (newParams: CycloParams) => void;
  viewMode?: 'standard' | 'tolerance';
  onViewModeChange?: (mode: 'standard' | 'tolerance') => void;
  className?: string;
}

const SliderControl = ({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange,
  info,
  action
}: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  step: number; 
  onChange: (val: number) => void;
  info?: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-6">
    <div className="flex justify-between items-end mb-2">
      <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-1">
        {label}
        {info && (
          <span title={info} className="cursor-help flex items-center">
            <Info size={14} className="text-slate-500" />
          </span>
        )}
      </label>
      <div className="flex items-center gap-3">
          {action}
          <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-blue-400 border border-slate-700">
            {value.toFixed(step < 0.1 ? 2 : 1)}
          </span>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
    />
  </div>
);

const Controls: React.FC<ControlsProps> = ({ params, onChange, viewMode, onViewModeChange, className }) => {
  
  const update = (key: keyof CycloParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const quality = getGeometricQuality(params);
  const physics = calculatePhysicsMetrics(params);

  // Determine Tool Size
  const minCurve = physics.minCurvatureRadius;
  const maxToolDiameter = minCurve > 0 ? (minCurve * 2).toFixed(2) : "N/A";

  return (
    <div className={`p-6 overflow-y-auto ${className}`}>
      
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">
             <Bookmark size={12} /> Quick Presets
        </div>
        <select 
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-slate-750 transition-colors"
            onChange={(e) => {
                const preset = PRESETS.find(p => p.name === e.target.value);
                if (preset) onChange(preset.params);
            }}
            defaultValue=""
        >
            <option value="" disabled>Select a configuration...</option>
            {PRESETS.map(p => (
                <option key={p.name} value={p.name}>
                    {p.name}
                </option>
            ))}
        </select>
      </div>

      <div className="h-px bg-slate-800 mb-8" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Sliders size={20} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Geometry</h2>
      </div>

      <SliderControl
        label="Pin Count (N)"
        value={params.pinCount}
        min={4}
        max={60}
        step={1}
        onChange={(v) => update('pinCount', v)}
        info="Number of stationary pins in the housing. Ratio will be (N-1):1."
      />

      <SliderControl
        label="Pin Circle Radius (R)"
        value={params.pinCircleRadius}
        min={10}
        max={200}
        step={0.5}
        onChange={(v) => update('pinCircleRadius', v)}
        info="Radius of the circle on which the housing pins are arranged."
      />

      <SliderControl
        label="Pin Radius (r)"
        value={params.pinRadius}
        min={1}
        max={20}
        step={0.1}
        onChange={(v) => update('pinRadius', v)}
        info="Radius of the individual housing pins/rollers."
      />

      <SliderControl
        label="Eccentricity (E)"
        value={params.eccentricity}
        min={0.1}
        max={10}
        step={0.1}
        onChange={(v) => update('eccentricity', v)}
        info="The offset distance of the input shaft center. Affects torque and smoothness."
      />

      <SliderControl
        label="Input Bearing Radius"
        value={params.holeRadius}
        min={2}
        max={50}
        step={0.5}
        onChange={(v) => update('holeRadius', v)}
        info="Radius of the center hole for the input eccentric bearing."
      />

      <div className="h-px bg-slate-800 mb-8" />

      {/* OUTPUT STAGE SECTION */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-600 rounded-lg">
          <RotateCw size={20} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Output Stage</h2>
      </div>
      
      <div className="mb-6 bg-slate-900 p-3 rounded-lg border border-slate-800">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Reference Frame</label>
          <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => update('driveConfig', 'housingFixed')}
                className={`p-2 text-xs rounded-md transition-colors border ${params.driveConfig === 'housingFixed' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
              >
                  Housing Fixed
                  <span className="block text-[10px] opacity-70 mt-1">Reducer Mode</span>
              </button>
              <button 
                onClick={() => update('driveConfig', 'outputFixed')}
                className={`p-2 text-xs rounded-md transition-colors border ${params.driveConfig === 'outputFixed' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
              >
                  Output Fixed
                  <span className="block text-[10px] opacity-70 mt-1">Hub Mode</span>
              </button>
          </div>
      </div>

      <SliderControl
        label="Output Pins Count"
        value={params.outputPinCount}
        min={3}
        max={12}
        step={1}
        onChange={(v) => update('outputPinCount', v)}
        info="Number of inner output rollers. Typically 6 or 8."
      />

      <SliderControl
        label="Output Pin Radius"
        value={params.outputPinRadius}
        min={1}
        max={20}
        step={0.5}
        onChange={(v) => update('outputPinRadius', v)}
        info="Radius of the output pins/rollers that engage the disc holes."
      />

      <SliderControl
        label="Output Circle Radius"
        value={params.outputPinCircleRadius}
        min={5}
        max={150}
        step={0.5}
        onChange={(v) => update('outputPinCircleRadius', v)}
        info="Placement radius of the output pins."
      />

      <div className="h-px bg-slate-800 mb-8" />

      {/* ENGINEERING ANALYSIS SECTION */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <Microscope size={20} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Analysis</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Activity size={12} /> Pressure Angle
              </div>
              <div className={`text-lg font-mono font-bold ${physics.maxPressureAngle > 45 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {physics.maxPressureAngle.toFixed(1)}°
              </div>
              <div className="text-[10px] text-slate-600">
                  {physics.maxPressureAngle > 45 ? 'Inefficient' : 'Good Efficiency'}
              </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Scale size={12} /> Max Tool Ø
              </div>
              <div className={`text-lg font-mono font-bold ${minCurve < 0.5 ? 'text-red-400' : 'text-slate-200'}`}>
                  {minCurve <= 0 ? 'Undercut' : `${maxToolDiameter}mm`}
              </div>
              <div className="text-[10px] text-slate-600">
                  Min Curvature
              </div>
          </div>
      </div>
      
      <div className="h-px bg-slate-800 mb-8" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-600 rounded-lg">
          <Settings2 size={20} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Manufacturing</h2>
      </div>

      <div className="mb-6">
         <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">
             <Printer size={12} /> Machine Settings
        </div>
        <select 
            className="w-full bg-slate-800 border border-slate-700 text-emerald-200 text-sm rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer hover:bg-slate-750 transition-colors"
            onChange={(e) => {
                const preset = MANUFACTURING_PRESETS.find(p => p.name === e.target.value);
                if (preset) {
                    onChange({ ...params, tolerance: preset.tolerance, holeTolerance: preset.holeTolerance });
                }
            }}
            defaultValue=""
        >
            <option value="" disabled>Select machine type...</option>
            {MANUFACTURING_PRESETS.map(p => (
                <option key={p.name} value={p.name}>
                    {p.name}
                </option>
            ))}
        </select>
      </div>

      <SliderControl
        label="Profile Tolerance (Gap)"
        value={params.tolerance}
        min={0}
        max={2.0}
        step={0.01}
        onChange={(v) => update('tolerance', v)}
        info="Shrinks the disc profile to create a gap for lubrication and manufacturing imperfections. 0.1-0.2mm recommended for FDM."
        action={onViewModeChange && (
            <button 
                onClick={() => onViewModeChange(viewMode === 'tolerance' ? 'standard' : 'tolerance')}
                className={`p-1 rounded hover:bg-slate-700 transition-colors ${viewMode === 'tolerance' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'}`}
                title="Visualize Gap"
            >
                <ScanEye size={16} />
            </button>
        )}
      />

      <SliderControl
        label="Hole Expansion"
        value={params.holeTolerance}
        min={0}
        max={1.0}
        step={0.01}
        onChange={(v) => update('holeTolerance', v)}
        info="Enlarges the center hole to ensure bearings fit. 0.1mm recommended."
      />

      <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <Circle size={14} />
          Calculated Specs
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <p className="text-slate-500 text-xs mb-1">Reduction Ratio</p>
                <p className="text-slate-200 font-mono">{params.pinCount - 1}:1</p>
            </div>
            <div>
                <p className="text-slate-500 text-xs mb-1">Disc Lobes</p>
                <p className="text-slate-200 font-mono">{params.pinCount - 1}</p>
            </div>
            <div>
                <p className="text-slate-500 text-xs mb-1">Max Diameter</p>
                <p className="text-slate-200 font-mono">~{(params.pinCircleRadius * 2 + params.pinRadius * 2).toFixed(1)}mm</p>
            </div>
        </div>
      </div>
      
      {quality.warnings.length > 0 && (
           <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-start gap-3 mb-3">
                   <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                   <div className="space-y-1">
                       {quality.warnings.map((w, i) => (
                           <p key={i} className="text-xs text-orange-200 font-medium leading-snug">{w}</p>
                       ))}
                   </div>
               </div>
               
               {quality.fixes.length > 0 && (
                   <div className="space-y-2 mt-3">
                        <p className="text-[10px] uppercase tracking-wider text-orange-400 font-bold ml-1">Recommended Fixes</p>
                        <div className="grid grid-cols-1 gap-2">
                            {quality.fixes.map((fix, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => onChange(fix.params)}
                                    className="w-full text-left p-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-colors group flex items-center justify-between"
                                >
                                    <div>
                                        <div className="text-xs font-bold text-orange-300 group-hover:text-orange-200 transition-colors">
                                            {fix.label}
                                        </div>
                                        <div className="text-[10px] text-orange-400/70 group-hover:text-orange-300">
                                            {fix.description}
                                        </div>
                                    </div>
                                    <Wand2 size={14} className="text-orange-500 opacity-50 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                                </button>
                            ))}
                        </div>
                   </div>
               )}
           </div>
      )}

      {quality.valid && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
              <p className="text-xs text-emerald-200">Geometry is valid and printable.</p>
          </div>
      )}

    </div>
  );
};

export default Controls;