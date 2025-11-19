
export interface CycloParams {
  pinCount: number; // Number of stationary pins
  pinCircleRadius: number; // Radius of the circle on which pins are placed (mm)
  pinRadius: number; // Radius of the individual pins (mm)
  eccentricity: number; // Offset distance (mm)
  holeRadius: number; // Output shaft hole radius (mm)
  resolution: number; // Number of points for curve generation
  tolerance: number; // Manufacturing tolerance/gap (mm) - shrinks the disc
  holeTolerance: number; // Hole expansion (mm)
  
  // Output Stage
  outputPinCount: number;
  outputPinRadius: number;
  outputPinCircleRadius: number;
  driveConfig: 'housingFixed' | 'outputFixed';
}

export interface Point {
  x: number;
  y: number;
  nx?: number; // Normal vector X
  ny?: number; // Normal vector Y
  pressureAngle?: number; // Degrees
  curvatureRadius?: number; // mm
}

export interface AnalysisResult {
  isValid: boolean;
  message: string;
  reductionRatio: number;
  outerDiameter: number;
  wallThicknessMin: number;
  interference: boolean;
}

export interface PhysicsMetrics {
  minCurvatureRadius: number; // Determines smallest CNC tool allowed
  maxPressureAngle: number; // Determines efficiency/locking risk
  points: Point[]; // Points enriched with physics data
}

export enum Tab {
  DESIGN = 'design',
  ANALYSIS = 'analysis',
  EXPORT = 'export'
}
