import { Point, CycloParams } from '../types';

export const generateDXF = (points: Point[], holes: Point[], params: CycloParams): string => {
    // Header
    let dxf = "0\nSECTION\n2\nENTITIES\n";

    // 1. Draw the Cycloidal Disc Profile (Polyline)
    // The 'points' array passed here should already be the one generated WITH tolerance.
    dxf += "0\nPOLYLINE\n8\nCycloidProfile\n66\n1\n70\n1\n"; // 70=1 means closed
    points.forEach(p => {
        dxf += "0\nVERTEX\n8\nCycloidProfile\n";
        dxf += `10\n${p.x.toFixed(4)}\n20\n${p.y.toFixed(4)}\n30\n0.0\n`;
    });
    dxf += "0\nSEQEND\n";

    // 2. Draw the Center Hole
    // Apply Hole Tolerance here
    const effectiveHoleRadius = params.holeRadius + params.holeTolerance;
    dxf += "0\nCIRCLE\n8\nCenterHole\n";
    dxf += `10\n0.0\n20\n0.0\n30\n0.0\n`;
    dxf += `40\n${effectiveHoleRadius.toFixed(4)}\n`;

    // Footer
    dxf += "0\nENDSEC\n0\nEOF\n";
    return dxf;
};