import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ScoredFile } from '../../utils/types';

interface Props {
  files: ScoredFile[];
}

const HeatmapGraph: React.FC<Props> = ({ files }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !files || files.length === 0) return;

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis: File Age (Days) - Log scale to spread low-age clusters
    const x = d3.scaleLog()
      .domain([1, d3.max(files, d => d.ageInDays) || 365])
      .range([0, width])
      .base(10);

    // Y axis: Total Commits - Log scale to spread low-commit clusters
    const y = d3.scaleLog()
      .domain([1, d3.max(files, d => d.totalCommits) || 100])
      .range([height, 0])
      .base(10);

    // Color mapping for danger levels
    const colorMap: Record<string, string> = {
      critical: "#f87171", // Red
      high: "#fb923c",     // Orange
      medium: "#facc15",   // Yellow
      low: "#60a5fa",      // Blue
      safe: "#4ade80"      // Green
    };

    const getColor = (d: ScoredFile) => {
      const level = (d.dangerLevel || 'safe').toLowerCase();
      return colorMap[level] || colorMap['safe'];
    };

    // Radius scale based on dangerScore
    const r = d3.scaleSqrt()
      .domain([0, 100])
      .range([2, 8]); // Smaller radius for less clutter

    // Definition for glow effect
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2")
      .attr("result", "blur");
    filter.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    // Tooltip setup
    const tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(15, 23, 42, 0.95)")
      .style("backdrop-filter", "blur(8px)")
      .style("color", "#fff")
      .style("padding", "12px")
      .style("border", "1px solid rgba(255,255,255,0.1)")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("box-shadow", "0 10px 15px -3px rgba(0, 0, 0, 0.3)")
      .style("z-index", "100");

    // Main drawing group with zoom support
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    d3.select(svgRef.current).call(zoom);

    // Grid lines (Log scale aware)
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10).tickSize(-height).tickFormat(() => ""))
      .style("stroke-dasharray", "2,2")
      .style("opacity", 0.05);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(() => ""))
      .style("stroke-dasharray", "2,2")
      .style("opacity", 0.05);

    // Axes
    const xAxis = g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(10, ".0f"))
      .attr("color", "currentColor")
      .style("opacity", 0.3);

    const yAxis = g.append("g")
      .call(d3.axisLeft(y).ticks(10, ".0s"))
      .attr("color", "currentColor")
      .style("opacity", 0.3);

    // Labels
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 45)
      .text("File Age (Days, Log Scale)")
      .style("fill", "currentColor")
      .style("font-size", "10px")
      .style("opacity", 0.5);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height / 2)
      .text("Total Commits (Log Scale)")
      .style("fill", "currentColor")
      .style("font-size", "10px")
      .style("opacity", 0.5);

    // Dots setup
    const node = g.append("g")
      .selectAll("circle")
      .data(files)
      .join("circle")
        .attr("r", d => r(d.dangerScore || 0))
        .style("fill", d => getColor(d))
        .style("opacity", 0.5) // Lower opacity for clarity in clusters
        .style("stroke", "rgba(255,255,255,0.2)")
        .style("stroke-width", "0.5px")
        .style("cursor", "crosshair")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("r", r(d.dangerScore || 0) * 1.5 + 2)
            .style("opacity", 1)
            .style("stroke-width", "1px")
            .attr("filter", "url(#glow)");
          
          tooltip.style("visibility", "visible")
                 .html(`
                   <div style="font-weight: bold; margin-bottom: 4px; color: ${getColor(d)}">${d.path.split('/').pop()}</div>
                   <div style="font-size: 10px; opacity: 0.6; margin-bottom: 8px;">${d.path}</div>
                   <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                     <div><span style="opacity: 0.5;">Risk Score:</span> ${(d.dangerScore || 0).toFixed(0)}</div>
                     <div><span style="opacity: 0.5;">Commits:</span> ${d.totalCommits}</div>
                     <div><span style="opacity: 0.5;">Age:</span> ${d.ageInDays}d</div>
                     <div><span style="opacity: 0.5;">Authors:</span> ${d.uniqueAuthors.length}</div>
                   </div>
                 `);
        })
        .on("mousemove", function(event) {
          tooltip.style("top", (event.pageY - 10) + "px")
                 .style("left", (event.pageX + 15) + "px");
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .attr("r", r(d.dangerScore || 0))
            .style("opacity", 0.5)
            .style("stroke-width", "0.5px")
            .attr("filter", null);
          tooltip.style("visibility", "hidden");
        });

    // FORCE SIMULATION for physical scattering
    const simulation = d3.forceSimulation(files as any)
      .force("x", d3.forceX((d: any) => x(Math.max(1, d.ageInDays))).strength(1))
      .force("y", d3.forceY((d: any) => y(Math.max(1, d.totalCommits))).strength(1))
      .force("collide", d3.forceCollide((d: any) => r(d.dangerScore || 0) + 3)) // Generous collision radius
      .on("tick", () => {
        node
          .attr("cx", (d: any) => {
            d.x = Math.max(0, Math.min(width, d.x));
            return d.x;
          })
          .attr("cy", (d: any) => {
            // Keep dots within the graph and above the X-axis (height)
            d.y = Math.max(0, Math.min(height, d.y));
            return d.y;
          });
      });

    return () => {
      simulation.stop();
    };

  }, [files]);

  return (
    <div className="bg-vscode-bg border border-vscode-border p-6 rounded-2xl shadow-biggest animate-in fade-in zoom-in duration-500 overflow-visible">
      <div className="w-full flex justify-between items-center mb-8 border-l-4 border-vscode-chart-blue pl-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Files heatmap</h3>
        </div>
        <div className="flex gap-4 items-center">
           <div className="text-[0.6rem] opacity-40 text-right mr-2 hidden sm:block">
              Interactive Zoom enabled.<br/>Scroll to explore clusters.
           </div>
           <div className="flex flex-col items-end gap-1">
              <span className="text-[0.6rem] uppercase tracking-tighter opacity-40 font-black">Stability Index</span>
              <div className="flex gap-1 h-3">
                 <div className="w-6 h-full rounded-sm bg-[#4ade80]" style={{ opacity: 0.6 }}></div>
                 <div className="w-6 h-full rounded-sm bg-[#60a5fa]" style={{ opacity: 0.6 }}></div>
                 <div className="w-6 h-full rounded-sm bg-[#fb923c]" style={{ opacity: 1 }}></div>
                 <div className="w-6 h-full rounded-sm bg-[#f87171]" style={{ opacity: 1 }}></div>

              </div>
           </div>
        </div>
      </div>
      
      <div className="relative cursor-move bg-vscode-sidebar/20 rounded-xl overflow-hidden border border-vscode-border/30">
        <svg ref={svgRef} className="w-full h-auto text-vscode-fg overflow-visible"></svg>
      </div>

    </div>
  );
};

export default HeatmapGraph;
