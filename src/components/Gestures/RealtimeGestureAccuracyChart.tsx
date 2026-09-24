/**
 * RealtimeGestureAccuracyChart Component
 *
 * Real-time D3 chart visualizing gesture recognition accuracy and clarity
 * over the last 60 seconds to provide precise feedback on gesture clarity.
 *
 * Features:
 * - Dynamic D3 SVG time-series (x: 60s window, y: 0% to 100% accuracy)
 * - Dual-series rendering:
 *   1. Area + Gradient Line: Overall Recognition Accuracy (%)
 *   2. Dashed Spectral Line: Gesture Clarity & Contour Solidity (%)
 * - Real-time animated target sweep and tracking dots
 * - Hover / Tooltip inspection with exact timestamp (-Xs ago), confidence, gesture, and clarity rating
 * - Live statistical HUD badges: Average Accuracy, Peak Accuracy, Current Clarity rating
 * - Responsive container sizing with ResizeObserver
 * - Cybernetic HUD styling matching Ultron theme with glowing gradients and threshold guides
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Activity, Zap, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Info } from 'lucide-react';
import { GestureAccuracyPoint } from '../../types/gestureAccuracy.ts';
import { gestureEngine } from '../../utils/handGestureDetector.ts';

interface RealtimeGestureAccuracyChartProps {
  className?: string;
  height?: number;
  showControls?: boolean;
}

export const RealtimeGestureAccuracyChart: React.FC<RealtimeGestureAccuracyChartProps> = ({
  className = '',
  height = 240,
  showControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Time-series data state (last 60 seconds)
  const [data, setData] = useState<GestureAccuracyPoint[]>(() => [...gestureEngine.accuracyHistory]);
  const [hoveredPoint, setHoveredPoint] = useState<GestureAccuracyPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // Subscribe to real-time accuracy buffer
  useEffect(() => {
    const unsub = gestureEngine.subscribeAccuracy((history) => {
      setData([...history]);
    });
    return unsub;
  }, []);

  // Responsive width observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Compute live analytical statistics for the last 60s
  const stats = useMemo(() => {
    if (data.length === 0) {
      return {
        avgAcc: 0,
        peakAcc: 0,
        currClarity: 0,
        rating: 'STANDBY',
        color: 'text-zinc-500',
        borderColor: 'border-zinc-700',
        activeCount: 0,
      };
    }

    const tracked = data.filter((d) => d.isTracking);
    const pool = tracked.length > 0 ? tracked : data;
    const sumAcc = pool.reduce((acc, d) => acc + d.accuracy, 0);
    const avgAcc = Math.round((sumAcc / pool.length) * 100);
    const peakAcc = Math.round(d3.max(pool, (d) => d.accuracy * 100) || 0);

    const latest = data[data.length - 1];
    const currClarity = Math.round((latest?.clarity || 0) * 100);

    let rating = 'POOR';
    let color = 'text-red-400';
    let borderColor = 'border-red-500/60';

    if (currClarity >= 90) {
      rating = 'PRISTINE';
      color = 'text-emerald-400';
      borderColor = 'border-emerald-500/60';
    } else if (currClarity >= 80) {
      rating = 'OPTIMAL';
      color = 'text-cyan-400';
      borderColor = 'border-cyan-500/60';
    } else if (currClarity >= 65) {
      rating = 'NOMINAL';
      color = 'text-amber-400';
      borderColor = 'border-amber-500/60';
    } else if (currClarity >= 45) {
      rating = 'MODERATE';
      color = 'text-orange-400';
      borderColor = 'border-orange-500/60';
    }

    return {
      avgAcc,
      peakAcc,
      currClarity,
      rating,
      color,
      borderColor,
      activeCount: tracked.length,
    };
  }, [data]);

  // Render D3 chart whenever data or width updates
  useEffect(() => {
    if (!svgRef.current || containerWidth <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 22, right: 35, bottom: 30, left: 45 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (width <= 50 || chartHeight <= 40) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const now = Date.now();
    const sixtySecsAgo = now - 60000;

    // Scales
    const xScale = d3
      .scaleTime()
      .domain([new Date(sixtySecsAgo), new Date(now)])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Accuracy Area Fill Gradient (Red/Crimson to transparent)
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-acc-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.45);

    areaGrad
      .append('stop')
      .attr('offset', '80%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.05);

    areaGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0);

    // Accuracy Line Gradient (Cyan to Crimson)
    const lineGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-acc-line-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    lineGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#38bdf8')
      .attr('stop-opacity', 0.85);

    lineGrad
      .append('stop')
      .attr('offset', '65%')
      .attr('stop-color', '#f87171')
      .attr('stop-opacity', 0.95);

    lineGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 1.0);

    // Filter glow
    const filter = defs
      .append('filter')
      .attr('id', 'd3-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'blur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Horizontal Grid Lines (0, 25, 50, 75, 90, 100%)
    const yTicks = [25, 50, 75, 90];
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', (d) => (d === 90 ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)'))
      .attr('stroke-dasharray', (d) => (d === 90 ? '4 4' : '2 4'))
      .attr('stroke-width', 0.8);

    // 90% "OPTIMAL CLARITY" Benchmark Label
    g.append('text')
      .attr('x', width - 4)
      .attr('y', yScale(90) - 4)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', 'rgba(52, 211, 153, 0.75)')
      .text('OPTIMAL THRESHOLD 90%');

    // X Axis with relative second labels (-60s, -45s, -30s, -15s, NOW)
    const xIntervals = [sixtySecsAgo, sixtySecsAgo + 15000, sixtySecsAgo + 30000, sixtySecsAgo + 45000, now];
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(xIntervals.map((t) => new Date(t)))
          .tickFormat((d) => {
            const diff = Math.round((now - (d as Date).getTime()) / 1000);
            return diff === 0 ? 'NOW' : `-${diff}s`;
          })
      );

    xAxis.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)');
    xAxis.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.15)');
    xAxis
      .selectAll('.tick text')
      .attr('font-family', 'monospace')
      .attr('font-size', '9px')
      .attr('fill', '#a1a1aa');

    // Y Axis (0% to 100%)
    const yAxis = g
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .tickValues([0, 25, 50, 75, 100])
          .tickFormat((d) => `${d}%`)
      );

    yAxis.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)');
    yAxis.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.15)');
    yAxis
      .selectAll('.tick text')
      .attr('font-family', 'monospace')
      .attr('font-size', '9px')
      .attr('fill', '#a1a1aa');

    // Data filtering for last 60s
    const filtered = data
      .filter((d) => d.timestamp >= sixtySecsAgo - 2000)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (filtered.length >= 2) {
      // 1. Accuracy Area
      const areaGen = d3
        .area<GestureAccuracyPoint>()
        .x((d) => xScale(new Date(d.timestamp)))
        .y0(chartHeight)
        .y1((d) => yScale(d.accuracy * 100))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filtered)
        .attr('fill', 'url(#d3-acc-area-grad)')
        .attr('d', areaGen);

      // 2. Gesture Clarity Curve (Dashed Cyan)
      const clarityLine = d3
        .line<GestureAccuracyPoint>()
        .x((d) => xScale(new Date(d.timestamp)))
        .y((d) => yScale(d.clarity * 100))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filtered)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '3 3')
        .attr('stroke-opacity', 0.75)
        .attr('d', clarityLine);

      // 3. Accuracy Line (Main glowing solid line)
      const accLine = d3
        .line<GestureAccuracyPoint>()
        .x((d) => xScale(new Date(d.timestamp)))
        .y((d) => yScale(d.accuracy * 100))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filtered)
        .attr('fill', 'none')
        .attr('stroke', 'url(#d3-acc-line-grad)')
        .attr('stroke-width', 2.2)
        .attr('filter', 'url(#d3-glow)')
        .attr('d', accLine);

      // 4. Highlight dots on recent data samples
      const dots = g
        .selectAll('.acc-dot')
        .data(filtered.slice(-18))
        .enter()
        .append('g')
        .attr('class', 'acc-dot');

      dots
        .append('circle')
        .attr('cx', (d) => xScale(new Date(d.timestamp)))
        .attr('cy', (d) => yScale(d.accuracy * 100))
        .attr('r', (d, i) => (i === filtered.slice(-18).length - 1 ? 4.5 : 2.5))
        .attr('fill', (d) => (d.isTracking ? '#ef4444' : '#52525b'))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 0.8)
        .attr('opacity', (d, i) => (i === filtered.slice(-18).length - 1 ? 1 : 0.75));

      // Latest pulsating radar ping ring
      const last = filtered[filtered.length - 1];
      if (last) {
        const lastX = xScale(new Date(last.timestamp));
        const lastY = yScale(last.accuracy * 100);

        g.append('circle')
          .attr('cx', lastX)
          .attr('cy', lastY)
          .attr('r', 8)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1.2)
          .attr('opacity', 0.8)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '4;12;4')
          .attr('dur', '1.8s')
          .attr('repeatCount', 'indefinite');
      }
    }

    // 5. Interactive Mouse Overlay for Crosshair & Tooltip
    const bisectDate = d3.bisector<GestureAccuracyPoint, Date>((d) => new Date(d.timestamp)).center;

    const crosshair = g
      .append('line')
      .attr('class', 'crosshair')
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', 'rgba(255,255,255,0.45)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3')
      .style('opacity', 0);

    const overlay = g
      .append('rect')
      .attr('width', width)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const hoveredDate = xScale.invert(mx);
        const index = bisectDate(filtered, hoveredDate);
        const point = filtered[index];

        if (point) {
          const px = xScale(new Date(point.timestamp));
          crosshair.attr('x1', px).attr('x2', px).style('opacity', 1);

          setHoveredPoint(point);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setHoverPos({
              x: px + margin.left,
              y: yScale(point.accuracy * 100) + margin.top,
            });
          }
        }
      })
      .on('mouseleave', () => {
        crosshair.style('opacity', 0);
        setHoveredPoint(null);
        setHoverPos(null);
      });
  }, [data, containerWidth, height]);

  // Handle manual test pulse (stimulates clarity feedback when camera is idle)
  const handleStimulateSample = () => {
    const now = Date.now();
    const gestureList = ['OPEN_PALM', 'VICTORY_PEACE', 'FIST', 'POINT_INDEX', 'THUMBS_UP'];
    const pick = gestureList[Math.floor(Math.random() * gestureList.length)];
    const randomAcc = 0.88 + (Math.random() * 0.1 - 0.03);
    const randomClarity = 0.86 + (Math.random() * 0.12 - 0.04);

    gestureEngine.accuracyHistory.push({
      timestamp: now,
      accuracy: Math.min(0.99, randomAcc),
      confidence: Math.min(0.98, randomAcc - 0.02),
      clarity: Math.min(0.99, randomClarity),
      gesture: pick,
      isTracking: true,
    });

    const cutoff = now - 60000;
    while (gestureEngine.accuracyHistory.length > 0 && gestureEngine.accuracyHistory[0].timestamp < cutoff) {
      gestureEngine.accuracyHistory.shift();
    }
    setData([...gestureEngine.accuracyHistory]);
  };

  return (
    <div
      ref={containerRef}
      id="realtime-gesture-accuracy-chart-container"
      className={`bg-[#06080e] border border-red-950/80 rounded-xs p-4 space-y-3 relative overflow-hidden font-mono ${className}`}
    >
      {/* Chart Top Header & Live KPI Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/90 gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-zinc-100 tracking-wider flex items-center gap-1.5 uppercase">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              GESTURE RECOGNITION ACCURACY & CLARITY (LAST 60 SECONDS)
            </span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Real-time D3 kinematic temporal feedback • 250ms optical window • Contour solidity analysis
          </p>
        </div>

        {/* Live Feedback Rating Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 bg-zinc-950/80 border ${stats.borderColor} rounded-xs flex items-center gap-2 shadow-[0_0_8px_rgba(239,68,68,0.25)]`}
          >
            <span className="text-[9px] text-zinc-400 uppercase font-bold">CLARITY RATING:</span>
            <span className={`text-xs font-bold tracking-widest ${stats.color}`}>
              {stats.rating}
            </span>
          </div>

          {showControls && (
            <button
              type="button"
              onClick={handleStimulateSample}
              className="px-2 py-1 bg-[#0e1017] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Inject live gesture pulse sample"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">+ SAMPLE PULSE</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 bg-[#090b12] border border-zinc-800/90 rounded-xs">
          <span className="text-[9px] text-zinc-400 uppercase block font-semibold">Average Accuracy</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-zinc-100">{stats.avgAcc}%</span>
            <span className="text-[9px] text-emerald-400 font-bold">NOMINAL</span>
          </div>
        </div>

        <div className="p-2 bg-[#090b12] border border-zinc-800/90 rounded-xs">
          <span className="text-[9px] text-zinc-400 uppercase block font-semibold">Peak Confidence</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-red-400">{stats.peakAcc}%</span>
            <span className="text-[9px] text-zinc-400">OPTIMAL</span>
          </div>
        </div>

        <div className="p-2 bg-[#090b12] border border-zinc-800/90 rounded-xs">
          <span className="text-[9px] text-zinc-400 uppercase block font-semibold">Contour Clarity</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-sm font-bold ${stats.color}`}>{stats.currClarity}%</span>
            <span className="text-[9px] text-zinc-400">SOLIDITY</span>
          </div>
        </div>

        <div className="p-2 bg-[#090b12] border border-zinc-800/90 rounded-xs">
          <span className="text-[9px] text-zinc-400 uppercase block font-semibold">Temporal Window</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-zinc-200">60 SEC</span>
            <span className="text-[9px] text-cyan-400">ROLLING</span>
          </div>
        </div>
      </div>

      {/* Legend & Telemetry Indicators */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-gradient-to-r from-cyan-400 via-red-400 to-red-500 rounded-full" />
            <span className="text-zinc-200 font-bold">RECOGNITION ACCURACY (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 border-b-2 border-dashed border-sky-400" />
            <span className="text-sky-300 font-bold">GESTURE CLARITY (%)</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-zinc-400">
          <Info className="w-3 h-3 text-zinc-400" />
          <span>Hover over chart to inspect precise timestamps</span>
        </div>
      </div>

      {/* D3 SVG Stage */}
      <div className="relative w-full overflow-hidden bg-[#030407] border border-zinc-800/90 rounded-xs">
        <svg
          ref={svgRef}
          className="w-full select-none"
          style={{ height: `${height}px` }}
        />

        {/* Dynamic Hover Tooltip Card */}
        {hoveredPoint && hoverPos && (
          <div
            className="absolute z-20 pointer-events-none p-2.5 bg-black/90 border border-red-500/80 rounded-xs shadow-[0_0_12px_rgba(239,68,68,0.4)] backdrop-blur-md text-[10px] space-y-1 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${hoverPos.x}px`,
              top: `${Math.max(28, hoverPos.y - 12)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-1">
              <span className="font-bold text-zinc-100">
                {hoveredPoint.gesture !== 'NONE' ? hoveredPoint.gesture : 'STANDBY (NO HAND)'}
              </span>
              <span className="text-zinc-400">
                {Math.round((Date.now() - hoveredPoint.timestamp) / 1000)}s ago
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-zinc-300">
              <span>Accuracy:</span>
              <span className="font-bold text-red-400">
                {Math.round(hoveredPoint.accuracy * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-zinc-300">
              <span>Clarity Index:</span>
              <span className="font-bold text-cyan-400">
                {Math.round(hoveredPoint.clarity * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-zinc-400">
              <span>Confidence:</span>
              <span>{Math.round(hoveredPoint.confidence * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Clarity Feedback Guidance */}
      <div className="p-2.5 bg-[#090b14] border border-zinc-800/80 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-zinc-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {stats.currClarity >= 80
              ? 'Optical hand positioning is optimal. Finger contour separation exhibits high signal-to-noise ratio.'
              : stats.currClarity >= 60
              ? 'Moderate clarity. Maintain adequate lighting and hold fingers steady within the optical center.'
              : 'Sub-optimal clarity. Ensure high contrast against background and align with the visual teaching guidelines.'}
          </span>
        </div>
        <span className="text-zinc-400 shrink-0">WINDOW: 60,000ms</span>
      </div>
    </div>
  );
};
