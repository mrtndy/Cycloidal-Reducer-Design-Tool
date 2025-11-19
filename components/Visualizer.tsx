import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { CycloParams, Point } from '../types';
import { generateCycloidProfile, generatePinPoints, getDiscSVGPath } from '../utils/geometry';
import { Eye, EyeOff, ScanEye } from 'lucide-react';

interface VisualizerProps {
  params: CycloParams;
  showPins?: boolean;
  animate?: boolean;
  viewMode?: 'standard' | 'tolerance';
}

const Visualizer: React.FC<VisualizerProps> = ({ params, showPins = true, animate = false, viewMode = 'standard' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDims, setShowDims] = useState(true);

  // Generate standard profile
  const profilePoints = useMemo(() => generateCycloidProfile(params), [params]);
  const theoreticalPoints = useMemo(() => generateCycloidProfile(params, 0), [params]);
  const pinPoints = useMemo(() => generatePinPoints(params), [params]);
  
  // Output Pins Generation
  const outputPinPoints = useMemo(() => {
      const pins: Point[] = [];
      for (let i = 0; i < params.outputPinCount; i++) {
          const angle = (i / params.outputPinCount) * 2 * Math.PI;
          pins.push({
              x: params.outputPinCircleRadius * Math.cos(angle),
              y: params.outputPinCircleRadius * Math.sin(angle)
          });
      }
      return pins;
  }, [params.outputPinCount, params.outputPinCircleRadius]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Pattern for tolerance
    const pattern = defs.append("pattern")
        .attr("id", "stripe-pattern")
        .attr("width", 8)
        .attr("height", 8)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("patternTransform", "rotate(45)");
    pattern.append("rect")
        .attr("width", 4).attr("height", 8)
        .attr("fill", "#f43f5e").attr("opacity", 0.8);

    // Gradient for Gold Cam
    const goldGrad = defs.append("linearGradient")
        .attr("id", "gold-grad")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "100%");
    goldGrad.append("stop").attr("offset", "0%").attr("stop-color", "#fbbf24"); // Amber 400
    goldGrad.append("stop").attr("offset", "50%").attr("stop-color", "#d97706"); // Amber 600
    goldGrad.append("stop").attr("offset", "100%").attr("stop-color", "#92400e"); // Amber 800

    // Groups
    const zoomGroup = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 50])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    const g = zoomGroup.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2}) scale(1, -1)`);

    const axesGroup = g.append('g').attr('class', 'axes');
    const housingGroup = g.append('g').attr('class', 'housing');
    const outputGroup = g.append('g').attr('class', 'output');
    const discGroup = g.append('g').attr('class', 'disc'); 
    
    // Input Assembly Group (Motor Shaft + Eccentric Cam + Bearing)
    const inputGroup = g.append('g').attr('class', 'input-assembly');
    
    const dimsGroup = g.append('g').attr('class', 'dimensions');

    // SVG Path for Disc with Holes
    const discPathString = getDiscSVGPath(profilePoints, params);
    const theoreticalPathString = getDiscSVGPath(theoreticalPoints, params);

    if (params.tolerance > 0) {
        const mask = defs.append("mask").attr("id", "gap-mask");
        mask.append("rect").attr("x", -3000).attr("y", -3000).attr("width", 6000).attr("height", 6000).attr("fill", "black");
        mask.append("path").attr("d", theoreticalPathString).attr("fill", "white").attr("fill-rule", "evenodd");
        mask.append("path").attr("d", discPathString).attr("fill", "black").attr("fill-rule", "evenodd");
    }

    // Axes
    axesGroup.append('line').attr('x1', -width).attr('y1', 0).attr('x2', width).attr('y2', 0).attr('stroke', '#1e293b').attr('stroke-width', 0.5);
    axesGroup.append('line').attr('x1', 0).attr('y1', -height).attr('x2', 0).attr('y2', height).attr('stroke', '#1e293b').attr('stroke-width', 0.5);

    // --- HOUSING PINS (Outer) ---
    if (showPins) {
      housingGroup.append('circle')
        .attr('r', params.pinCircleRadius)
        .attr('fill', 'none')
        .attr('stroke', '#334155')
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-width', 0.5);

      housingGroup.selectAll('.pin')
        .data(pinPoints)
        .enter()
        .append('circle')
        .attr('class', 'pin')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', params.pinRadius)
        .attr('fill', '#3b82f6')
        .attr('fill-opacity', 0.15)
        .attr('stroke', '#60a5fa')
        .attr('stroke-width', viewMode === 'tolerance' ? 0.5 : 1.0)
        .attr('vector-effect', 'non-scaling-stroke');
    }
    
    // --- OUTPUT PINS (Inner) ---
    outputGroup.selectAll('.out-pin')
        .data(outputPinPoints)
        .enter()
        .append('circle')
        .attr('class', 'out-pin')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', params.outputPinRadius)
        .attr('fill', '#a855f7') // Purple
        .attr('fill-opacity', 0.3)
        .attr('stroke', '#d8b4fe')
        .attr('stroke-width', 1.0)
        .attr('vector-effect', 'non-scaling-stroke');

    // --- DISC ---
    
    if (params.tolerance > 0 && (viewMode === 'tolerance' || viewMode === 'standard')) {
        discGroup.append("rect")
            .attr("x", -params.pinCircleRadius * 1.5)
            .attr("y", -params.pinCircleRadius * 1.5)
            .attr("width", params.pinCircleRadius * 3)
            .attr("height", params.pinCircleRadius * 3)
            .attr("fill", "url(#stripe-pattern)")
            .attr("mask", "url(#gap-mask)")
            .attr("opacity", viewMode === 'tolerance' ? 1 : 0.3);
    }

    if (params.tolerance > 0) {
        discGroup.append('path')
            .attr('d', theoreticalPathString)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '3,3')
            .attr('stroke-opacity', 0.5)
            .attr('fill-rule', 'evenodd')
            .attr('vector-effect', 'non-scaling-stroke');
    }

    discGroup.append('path')
        .attr('d', discPathString)
        .attr('fill', '#10b981')
        .attr('fill-opacity', viewMode === 'tolerance' ? 0.05 : 0.15)
        .attr('stroke', '#34d399')
        .attr('stroke-width', 1.5)
        .attr('fill-rule', 'evenodd')
        .attr('vector-effect', 'non-scaling-stroke');

    // --- INPUT ASSEMBLY (Detailed) ---
    const bearingWidth = params.holeRadius * 0.2;
    const camRadius = params.holeRadius - bearingWidth;
    
    inputGroup.append('circle')
        .attr('class', 'bearing')
        .attr('cx', params.eccentricity)
        .attr('cy', 0)
        .attr('r', params.holeRadius)
        .attr('fill', '#94a3b8') 
        .attr('stroke', '#475569')
        .attr('stroke-width', 0.5);
        
    inputGroup.append('circle')
        .attr('class', 'bearing-inner')
        .attr('cx', params.eccentricity)
        .attr('cy', 0)
        .attr('r', camRadius + 0.5) 
        .attr('fill', '#cbd5e1') 
        .attr('stroke', 'none');

    inputGroup.append('circle')
        .attr('class', 'cam')
        .attr('cx', params.eccentricity)
        .attr('cy', 0)
        .attr('r', camRadius)
        .attr('fill', 'url(#gold-grad)')
        .attr('stroke', '#b45309') 
        .attr('stroke-width', 1);
        
    inputGroup.append('line')
        .attr('x1', params.eccentricity)
        .attr('y1', 0)
        .attr('x2', params.eccentricity + camRadius)
        .attr('y2', 0)
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.7);

    inputGroup.append('circle')
        .attr('class', 'motor-shaft')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', params.eccentricity * 0.6) 
        .attr('fill', '#1e293b') 
        .attr('stroke', '#475569')
        .attr('stroke-width', 0.5);

    // --- ANNOTATIONS ---
    if (showDims && viewMode === 'standard') {
        const fs = Math.max(3, params.pinCircleRadius * 0.06);
        const textColor = '#94a3b8';
        
        // Helper to position text correctly in flipped coordinate system
        const addLabel = (x: number, y: number, text: string, color: string, anchor = 'middle') => {
             dimsGroup.append('text')
                .attr('transform', `translate(${x}, ${y}) scale(1, -1)`)
                .text(text)
                .attr('fill', color)
                .attr('font-family', 'sans-serif')
                .attr('font-size', fs)
                .attr('font-weight', '600')
                .attr('text-anchor', anchor)
                .attr('alignment-baseline', 'middle')
                .style('paint-order', 'stroke')
                .style('stroke', '#020617') // Dark background outline
                .style('stroke-width', 3)
                .style('stroke-linecap', 'round')
                .style('stroke-linejoin', 'round');
        };

        // 1. Dimension R (Pin Circle Radius) - 60 degrees
        const angleR = Math.PI / 3;
        const rX = params.pinCircleRadius * Math.cos(angleR);
        const rY = params.pinCircleRadius * Math.sin(angleR);
        
        dimsGroup.append('line')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', rX).attr('y2', rY)
            .attr('stroke', textColor).attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '4,4');
        
        dimsGroup.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 1).attr('fill', textColor);
        
        // Place text at 60% distance
        addLabel(rX * 0.6, rY * 0.6 + fs, `R ${params.pinCircleRadius}`, textColor);

        // 2. Dimension r (Pin Radius) - 0 degrees (Rightmost pin)
        const pinX = params.pinCircleRadius;
        const pinR = params.pinRadius;
        
        // Leader line
        dimsGroup.append('path')
            .attr('d', `M ${pinX + pinR} 0 L ${pinX + pinR + fs * 2} 0`)
            .attr('stroke', '#60a5fa').attr('stroke-width', 0.5);
            
        addLabel(pinX + pinR + fs * 2.5, 0, `r ${params.pinRadius}`, '#60a5fa', 'start');

        // 3. Dimension Eccentricity (e) - Bottom Detail
        // Move clear of the mechanism
        const dimY = -params.pinCircleRadius - params.pinRadius - fs * 2.5;
        
        // Extension lines
        dimsGroup.append('line')
            .attr('x1', 0).attr('y1', -params.holeRadius - 2)
            .attr('x2', 0).attr('y2', dimY)
            .attr('stroke', '#f59e0b').attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0.7);
            
        dimsGroup.append('line')
            .attr('x1', params.eccentricity).attr('y1', -params.holeRadius - 2)
            .attr('x2', params.eccentricity).attr('y2', dimY)
            .attr('stroke', '#f59e0b').attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0.7);

        // Arrow line
        dimsGroup.append('line')
            .attr('x1', -fs).attr('y1', dimY + fs/2)
            .attr('x2', params.eccentricity + fs).attr('y2', dimY + fs/2)
            .attr('stroke', '#f59e0b').attr('stroke-width', 0.5);

        addLabel(params.eccentricity / 2, dimY - fs * 0.5, `e ${params.eccentricity}`, '#f59e0b');

        // 4. Output Dimensions (Top Left - 120 deg)
        const outAngle = 2 * Math.PI / 3;
        const outDist = params.outputPinCircleRadius;
        const oX = outDist * Math.cos(outAngle);
        const oY = outDist * Math.sin(outAngle);
        
        dimsGroup.append('line')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', oX).attr('y2', oY)
            .attr('stroke', '#c084fc').attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '4,4');
            
        addLabel(oX * 0.6, oY * 0.6 + fs, `R_out ${params.outputPinCircleRadius}`, '#c084fc');
        
        // Output pin radius (r_out)
        if (outputPinPoints.length > 0) {
            // Use the generated output pin point if possible, but here we calculate generic pos
            // The output pins rotate, so static dims might look off if animating.
            // We'll place this dim relative to the circle line we just drew.
            dimsGroup.append('circle')
                .attr('cx', oX).attr('cy', oY).attr('r', params.outputPinRadius)
                .attr('fill', 'none').attr('stroke', '#c084fc').attr('stroke-width', 0.5).attr('stroke-dasharray', '2,2');
                
            dimsGroup.append('line')
                .attr('x1', oX - params.outputPinRadius).attr('y1', oY)
                .attr('x2', oX - params.outputPinRadius - fs*2).attr('y2', oY)
                .attr('stroke', '#d8b4fe').attr('stroke-width', 0.5);
                
            addLabel(oX - params.outputPinRadius - fs*2.5, oY, `r_out ${params.outputPinRadius}`, '#d8b4fe', 'end');
        }
    }

    // Initial Zoom
    const maxR = params.pinCircleRadius + params.pinRadius + 20;
    const k = Math.min(width, height) / (maxR * 2.6); // Slightly zoomed out to fit new dims
    const initialTransform = d3.zoomIdentity
        .translate(width / 2 * (1 - k), height / 2 * (1 - k))
        .scale(k);
    svg.call(zoom.transform, initialTransform);

    // Force initial static render placement
    const initCx = params.eccentricity;
    const initCy = 0;
    discGroup.attr('transform', `translate(${initCx}, ${initCy})`);
    inputGroup.attr('transform', `rotate(0)`); // Initial angle 0

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    if (animate) {
        let t = 0;
        const N = params.pinCount;
        const E = params.eccentricity;
        const reducerRatio = N - 1;
        
        const animateFrame = () => {
            t += 0.02;
            
            // Calculate Angles based on Drive Configuration
            let housingAngle = 0;
            let outputAngle = 0;
            let discRotation = 0;
            let eccentricAngle = t; 

            if (params.driveConfig === 'housingFixed') {
                // HOUSING FIXED (Reducer)
                housingAngle = 0;
                // Disc rotates opposite to input, slower
                discRotation = -t / reducerRatio;
                outputAngle = discRotation;
            } else {
                // OUTPUT FIXED (Hub Motor)
                outputAngle = 0;
                // Housing rotates in SAME direction as input
                housingAngle = t / N; 
                discRotation = 0;
            }

            const housingDeg = housingAngle * 180 / Math.PI;
            const outputDeg = outputAngle * 180 / Math.PI;
            const discRotDeg = discRotation * 180 / Math.PI;
            const inputDeg = eccentricAngle * 180 / Math.PI;
            
            // 1. Move Input Assembly (Shaft + Cam + Bearing)
            // The whole group rotates at the input speed
            inputGroup.attr('transform', `rotate(${inputDeg})`);

            // Calculate current Disc Center for translation
            const cx = E * Math.cos(eccentricAngle);
            const cy = E * Math.sin(eccentricAngle);
            
            // 2. Move Housing
            housingGroup.attr('transform', `rotate(${housingDeg})`);
            
            // 3. Move Output Pins
            outputGroup.attr('transform', `rotate(${outputDeg})`);
            
            // 4. Move Disc
            discGroup.attr('transform', `translate(${cx}, ${cy}) rotate(${discRotDeg})`);
            
            animationFrameId = requestAnimationFrame(animateFrame);
        };
        animateFrame();
    }

    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [params, showPins, animate, profilePoints, theoreticalPoints, pinPoints, outputPinPoints, showDims, viewMode]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] bg-slate-950 relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full cursor-move active:cursor-grabbing" />
      {viewMode === 'tolerance' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-red-500/30 px-6 py-3 rounded-full backdrop-blur flex items-center gap-3 shadow-2xl z-20 animate-in slide-in-from-bottom-4">
              <ScanEye className="text-red-400 animate-pulse" size={20} />
              <div>
                  <p className="text-red-200 font-bold text-sm">Tolerance Inspection Mode</p>
                  <p className="text-red-400/70 text-xs">Red zone indicates {params.tolerance}mm material removal</p>
              </div>
          </div>
      )}

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
            onClick={() => setShowDims(!showDims)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors shadow-lg"
            title="Toggle Dimensions"
        >
            {showDims ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Visualizer;