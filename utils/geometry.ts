
import { CycloParams, Point, PhysicsMetrics } from '../types';
import * as d3 from 'd3';

// Helper to calculate distance between two points
const dist = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

/**
 * Generates the cycloidal profile.
 * @param params The full parameter set.
 * @param overrideTolerance If provided, overrides the params.tolerance. Use 0 for theoretical curve.
 */
export const generateCycloidProfile = (params: CycloParams, overrideTolerance?: number): Point[] => {
  const { pinCount, pinCircleRadius, pinRadius, eccentricity, resolution, tolerance } = params;
  
  const effectiveTolerance = overrideTolerance !== undefined ? overrideTolerance : tolerance;

  // Standard Cycloidal Disc Geometry
  const N = pinCount; 
  const R = pinCircleRadius;
  const r = pinRadius + effectiveTolerance; 
  const E = eccentricity;
  
  const points: Point[] = [];

  for (let i = 0; i <= resolution; i++) {
    const t = (i / resolution) * 2 * Math.PI;

    // 1. Calculate Position of Pin Center relative to Disc Center (Standard CCW Parametric)
    // Note: Previous version had inverted Y (-R*sin...). We standardize to +R*sin to match CCW rotation logic.
    const sx = R * Math.cos(t) - E * Math.cos(N * t);
    const sy = R * Math.sin(t) - E * Math.sin(N * t);

    // 2. Calculate Derivatives for Normal Vector
    const dxdt = -R * Math.sin(t) + E * N * Math.sin(N * t);
    const dydt = R * Math.cos(t) - E * N * Math.cos(N * t);

    const len = Math.sqrt(dxdt * dxdt + dydt * dydt);
    
    if (len < 1e-6 || isNaN(len)) {
        continue;
    }
    
    // Normal vector pointing "Inward" (Right hand rule relative to tangent)
    // Tangent = (dxdt, dydt). Normal = (-dydt, dxdt) normalized?
    // We want the offset to be towards the "inside" of the curve.
    // For an epitrochoid/cycloid generated this way, the "outward" normal is (dydt, -dxdt).
    // So inward is (-dydt, dxdt).
    
    const nx = -dydt / len;
    const ny = dxdt / len;
    
    // Apply offset (contraction)
    const px = sx + r * nx; // Sign depends on winding order. For this standard eq, +r*nx shrinks it.
    const py = sy + r * ny;
    
    points.push({ x: px, y: py, nx, ny });
  }
  
  return points;
};

// Helper to build SVG path string with holes
export const getDiscSVGPath = (profilePoints: Point[], params: CycloParams): string => {
    const lineGenerator = d3.line<Point>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveLinearClosed);
      
    let pathD = lineGenerator(profilePoints) || "";

    // Generate Output Holes (Cutouts)
    const holeR = params.outputPinRadius + params.eccentricity + params.holeTolerance;
    const numHoles = params.outputPinCount;
    const holeDist = params.outputPinCircleRadius;

    for (let i = 0; i < numHoles; i++) {
        const angle = (i / numHoles) * 2 * Math.PI;
        const cx = holeDist * Math.cos(angle);
        const cy = holeDist * Math.sin(angle);
        
        // Draw circle manually in reverse
        pathD += ` M ${cx + holeR} ${cy}`;
        pathD += ` A ${holeR} ${holeR} 0 1 0 ${cx - holeR} ${cy}`;
        pathD += ` A ${holeR} ${holeR} 0 1 0 ${cx + holeR} ${cy}`;
    }
    
    return pathD;
};

export const calculatePhysicsMetrics = (params: CycloParams): PhysicsMetrics => {
    const { pinCount: N, pinCircleRadius: R, eccentricity: E, pinRadius: r, resolution } = params;
    
    const points: Point[] = [];
    let minCurvatureRadius = Number.MAX_VALUE;
    let maxPressureAngle = 0;

    for (let i = 0; i <= resolution; i++) {
        const t = (i / resolution) * 2 * Math.PI;

        const dxdt = -R * Math.sin(t) + E * N * Math.sin(N * t);
        const dydt = R * Math.cos(t) - E * N * Math.cos(N * t);
        const len = Math.sqrt(dxdt * dxdt + dydt * dydt);

        if (len < 1e-6) continue;

        // 1. Pressure Angle
        const K = (E * N) / R;
        const num = K * Math.sin(N * t);
        const den = 1 - K * Math.cos(N * t);
        const pressureRad = Math.atan2(Math.abs(num), Math.abs(den)); 
        const pressureDeg = pressureRad * (180 / Math.PI);

        if (pressureDeg > maxPressureAngle) maxPressureAngle = pressureDeg;

        // 2. Curvature Radius
        const phi = (N - 1) * t; 
        const term1 = R * R + E * E * N * N - 2 * R * E * N * Math.cos(phi);
        const numerator = Math.pow(term1, 1.5);
        const denominator = R * R + E * E * N * N * N - R * E * N * (N + 1) * Math.cos(phi);
        
        const rho = numerator / denominator;
        const surfaceCurvature = rho - r; 

        if (Math.abs(surfaceCurvature) < Math.abs(minCurvatureRadius)) {
            minCurvatureRadius = surfaceCurvature;
        }

        const nx = -dydt / len;
        const ny = dxdt / len;
        
        const sx = R * Math.cos(t) - E * Math.cos(N * t);
        const sy = R * Math.sin(t) - E * Math.sin(N * t);
        
        points.push({
            x: sx + r * nx,
            y: sy + r * ny,
            nx, ny,
            pressureAngle: pressureDeg,
            curvatureRadius: surfaceCurvature
        });
    }

    return {
        minCurvatureRadius,
        maxPressureAngle,
        points
    };
}

export const generatePinPoints = (params: CycloParams): Point[] => {
  const { pinCount, pinCircleRadius } = params;
  const pins: Point[] = [];
  for (let i = 0; i < pinCount; i++) {
    const angle = (i / pinCount) * 2 * Math.PI;
    pins.push({
      x: pinCircleRadius * Math.cos(angle),
      y: pinCircleRadius * Math.sin(angle),
    });
  }
  return pins;
};

export const calculateMinWallThickness = (points: Point[], holeRadius: number): number => {
    let minDist = Number.MAX_VALUE;
    for(const p of points) {
        const d = Math.sqrt(p.x * p.x + p.y * p.y);
        const wall = d - holeRadius;
        if (wall < minDist) minDist = wall;
    }
    return minDist;
};

export interface GeometricFix {
    label: string;
    description: string;
    params: CycloParams;
}

export interface GeometricQuality {
    valid: boolean;
    warnings: string[];
    fixes: GeometricFix[];
}

export const getGeometricQuality = (params: CycloParams): GeometricQuality => {
    const { pinCount, pinCircleRadius, eccentricity, pinRadius, holeRadius } = params;
    const warnings: string[] = [];
    const fixes: GeometricFix[] = [];
    
    // Heuristics
    const maxSafeEccentricity = pinCircleRadius / (1.5 * pinCount);
    if (eccentricity > maxSafeEccentricity) {
        warnings.push(`Eccentricity (${eccentricity}mm) is too high for this radius.`);
        const safeE = parseFloat((pinCircleRadius / (2.0 * pinCount)).toFixed(2));
        fixes.push({
            label: "Reduce Eccentricity",
            description: `Lower E to ${safeE}mm`,
            params: { ...params, eccentricity: safeE }
        });
        const safeR = parseFloat((eccentricity * 2.0 * pinCount).toFixed(1));
        fixes.push({
            label: "Increase Radius",
            description: `Enlarge R to ${safeR}mm`,
            params: { ...params, pinCircleRadius: safeR }
        });
    }

    const pinSpacing = (2 * Math.PI * pinCircleRadius) / pinCount;
    if (pinRadius * 2 > pinSpacing * 0.95) {
        warnings.push(`Pins are too large for spacing.`);
        const safePinR = parseFloat(((pinSpacing * 0.9) / 2).toFixed(2));
        fixes.push({
            label: "Shrink Pins",
            description: `Reduce pin Ø to ${safePinR*2}mm`,
            params: { ...params, pinRadius: safePinR }
        });
    }

    const approxInnerRadius = pinCircleRadius - (pinCount * eccentricity) - pinRadius;
    if (approxInnerRadius < holeRadius + 1.5) {
         warnings.push(`Wall thickness is critically low.`);
         const maxHole = Math.max(2, approxInnerRadius - 2.0);
         const safeHole = parseFloat(maxHole.toFixed(1));
         if (safeHole > 0) {
             fixes.push({
                 label: "Shrink Center Hole",
                 description: `Set Hole R to ${safeHole}mm`,
                 params: { ...params, holeRadius: safeHole }
             });
         }
    }

    const uniqueFixes = fixes.filter((fix, index, self) =>
        index === self.findIndex((f) => (
            f.label === fix.label && JSON.stringify(f.params) === JSON.stringify(fix.params)
        ))
    );

    return {
        valid: warnings.length === 0,
        warnings,
        fixes: uniqueFixes
    };
};

export const checkInterference = (points: Point[]): boolean => { return false; };
