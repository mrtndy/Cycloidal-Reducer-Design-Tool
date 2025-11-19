
import { CycloParams } from './types';

export const DEFAULT_PARAMS: CycloParams = {
  pinCount: 12,
  pinCircleRadius: 50,
  pinRadius: 5,
  eccentricity: 1.5,
  holeRadius: 10, // This is now the center bearing hole
  resolution: 720,
  tolerance: 0.15, 
  holeTolerance: 0.1,
  
  outputPinCount: 6,
  outputPinRadius: 5,
  outputPinCircleRadius: 25,
  driveConfig: 'housingFixed'
};

export const PRESETS = [
  {
    name: "Standard (11:1)",
    description: "Balanced reduction and size.",
    params: DEFAULT_PARAMS
  },
  {
    name: "Compact NEMA 17 (9:1)",
    description: "Small footprint for stepper motors.",
    params: {
      ...DEFAULT_PARAMS,
      pinCount: 10,
      pinCircleRadius: 22,
      pinRadius: 3,
      eccentricity: 1.0,
      holeRadius: 5,
      outputPinCount: 4,
      outputPinRadius: 2.5,
      outputPinCircleRadius: 12,
      tolerance: 0.1,
      holeTolerance: 0.1
    }
  },
  {
    name: "High Reduction (39:1)",
    description: "Precision movement with high torque.",
    params: {
      ...DEFAULT_PARAMS,
      pinCount: 40,
      pinCircleRadius: 80,
      pinRadius: 3,
      eccentricity: 0.8,
      holeRadius: 12,
      outputPinCount: 6,
      outputPinRadius: 5,
      outputPinCircleRadius: 40,
      resolution: 1440,
      tolerance: 0.05,
      holeTolerance: 0.05
    }
  },
  {
    name: "Heavy Duty (7:1)",
    description: "Large pins for maximum load capacity.",
    params: {
      ...DEFAULT_PARAMS,
      pinCount: 8,
      pinCircleRadius: 100,
      pinRadius: 15,
      eccentricity: 4.0,
      holeRadius: 25,
      outputPinCount: 6,
      outputPinRadius: 12,
      outputPinCircleRadius: 50,
      tolerance: 0.25,
      holeTolerance: 0.2
    }
  }
];

export const MANUFACTURING_PRESETS = [
  { name: "CNC Machining (ISO Fit)", tolerance: 0.025, holeTolerance: 0.01 },
  { name: "Bambu Lab / Prusa (High Prec)", tolerance: 0.08, holeTolerance: 0.05 },
  { name: "Standard FDM (Ender 3)", tolerance: 0.15, holeTolerance: 0.10 },
  { name: "Resin / SLA (Formlabs)", tolerance: 0.05, holeTolerance: 0.03 },
  { name: "Loose Fit (Prototyping)", tolerance: 0.25, holeTolerance: 0.20 }
];

export const AI_MODEL_ANALYSIS = 'gemini-2.5-flash';
export const AI_MODEL_CHAT = 'gemini-2.5-flash';
export const AI_MODEL_GENERATE = 'gemini-2.5-flash';
