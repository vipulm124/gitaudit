import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { ScoredFile } from '../../utils/types';

interface Props {
  files: ScoredFile[];
}

/* ────────────────────────────────────────────────────────
 *  Utility: Build a hierarchy from flat file paths
 * ──────────────────────────────────────────────────────── */
interface TreeNode {
  name: string;
  fullPath: string;
  children?: TreeNode[];
  file?: ScoredFile;        // leaf only
  dangerScore?: number;     // leaf only
  dangerLevel?: string;     // leaf only
}

function buildHierarchy(files: ScoredFile[]): TreeNode {
  const root: TreeNode = { name: 'root', fullPath: '', children: [] };

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        current.children!.push({
          name: part,
          fullPath: file.path,
          file,
          dangerScore: file.dangerScore,
          dangerLevel: file.dangerLevel,
        });
      } else {
        let child = current.children!.find(c => c.name === part && c.children);
        if (!child) {
          child = { name: part, fullPath: parts.slice(0, i + 1).join('/'), children: [] };
          current.children!.push(child);
        }
        current = child;
      }
    }
  }

  // Collapse single-child intermediate directories (src/ -> src/utils becomes "src/utils")
  function collapse(node: TreeNode): TreeNode {
    if (!node.children) return node;
    node.children = node.children.map(collapse);
    if (node.children.length === 1 && node.children[0].children && node.name !== 'root') {
      const child = node.children[0];
      return {
        ...child,
        name: `${node.name}/${child.name}`,
      };
    }
    return node;
  }

  return collapse(root);
}

/* ────────────────────────────────────────────────────────
 *  Color scheme for danger levels
 * ──────────────────────────────────────────────────────── */
const dangerColors: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#3b82f6',
  safe:     '#22c55e',
};

const dangerBg: Record<string, string> = {
  critical: 'rgba(239, 68, 68, 0.15)',
  high:     'rgba(249, 115, 22, 0.15)',
  medium:   'rgba(234, 179, 8, 0.15)',
  low:      'rgba(59, 130, 246, 0.15)',
  safe:     'rgba(34, 197, 94, 0.15)',
};

function getColor(level?: string): string {
  return dangerColors[(level || 'safe').toLowerCase()] || dangerColors.safe;
}

function getBgColor(level?: string): string {
  return dangerBg[(level || 'safe').toLowerCase()] || dangerBg.safe;
}

/* ────────────────────────────────────────────────────────
 *  Aggregate stats for directory nodes
 * ──────────────────────────────────────────────────────── */
function getDirStats(node: d3.HierarchyRectangularNode<TreeNode>) {
  const leaves = node.leaves();
  const total = leaves.length;
  const avgScore = total > 0
    ? leaves.reduce((s, l) => s + (l.data.dangerScore || 0), 0) / total
    : 0;
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, safe: 0 };
  leaves.forEach(l => {
    const lvl = (l.data.dangerLevel || 'safe').toLowerCase();
    counts[lvl] = (counts[lvl] || 0) + 1;
  });
  const worst = (['critical', 'high', 'medium', 'low', 'safe'] as const).find(k => counts[k] > 0) || 'safe';
  return { total, avgScore, counts, worst };
}

/* ────────────────────────────────────────────────────────
 *  Component
 * ──────────────────────────────────────────────────────── */
const HeatmapGraph: React.FC<Props> = ({ files }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomPath, setZoomPath] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; content: React.ReactNode;
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      // Keep a reasonable aspect ratio
      setDimensions({ width, height: Math.max(400, Math.min(600, width * 0.6)) });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Build hierarchy once
  const rootData = useMemo(() => buildHierarchy(files), [files]);

  // Navigate to the zoomed subtree
  const currentNode = useMemo(() => {
    let node = rootData;
    for (const seg of zoomPath) {
      const child = node.children?.find(c => c.name === seg);
      if (child && child.children) {
        node = child;
      } else {
        break;
      }
    }
    return node;
  }, [rootData, zoomPath]);

  // Compute treemap layout
  const treemapRoot = useMemo(() => {
    const hierarchy = d3.hierarchy(currentNode)
      .sum(d => (d.children ? 0 : Math.max(1, d.dangerScore || 1)))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap<TreeNode>()
      .size([dimensions.width, dimensions.height])
      .paddingInner(2)
      .paddingOuter(4)
      .paddingTop(22)
      .round(true)
      .tile(d3.treemapSquarify.ratio(1.2))
      (hierarchy);

    return hierarchy as d3.HierarchyRectangularNode<TreeNode>;
  }, [currentNode, dimensions]);

  // Get the depth-1 children for rendering (directories + leaf files)
  const tiles = useMemo(() => {
    const result: d3.HierarchyRectangularNode<TreeNode>[] = [];
    if (!treemapRoot.children) {
      // All leaves - show them directly
      result.push(treemapRoot);
    } else {
      treemapRoot.children.forEach(child => {
        result.push(child);
      });
    }
    return result;
  }, [treemapRoot]);

  const handleTileClick = (...pathSegments: string[]) => {
    if (pathSegments.length > 0) {
      setZoomPath(prev => [...prev, ...pathSegments]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setZoomPath(prev => prev.slice(0, index));
  };

  const handleMouseEnter = (
    e: React.MouseEvent,
    node: d3.HierarchyRectangularNode<TreeNode>
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (node.data.file) {
      // Leaf node (file)
      const f = node.data.file;
      setTooltip({
        x, y,
        content: (
          <div>
            <div className="font-bold mb-1" style={{ color: getColor(f.dangerLevel) }}>
              {node.data.name}
            </div>
            <div className="text-[10px] opacity-50 mb-2 break-all">{f.path}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <div><span className="opacity-50">Risk:</span> {f.dangerScore.toFixed(0)}</div>
              <div><span className="opacity-50">Level:</span> {f.dangerLevel}</div>
              <div><span className="opacity-50">Commits:</span> {f.totalCommits}</div>
              <div><span className="opacity-50">Authors:</span> {f.uniqueAuthors.length}</div>
              <div><span className="opacity-50">Age:</span> {f.ageInDays}d</div>
              <div><span className="opacity-50">Bug Fix %:</span> {(f.bugFixRatio * 100).toFixed(0)}%</div>
            </div>
          </div>
        ),
      });
    } else {
      // Directory node
      const stats = getDirStats(node);
      setTooltip({
        x, y,
        content: (
          <div>
            <div className="font-bold mb-1">{node.data.name}/</div>
            <div className="text-[11px] mb-2">
              <span className="opacity-50">{stats.total} files</span>
              <span className="mx-2">·</span>
              <span className="opacity-50">Avg Risk:</span> {stats.avgScore.toFixed(1)}
            </div>
            <div className="flex gap-1.5 text-[10px]">
              {(['critical', 'high', 'medium', 'low', 'safe'] as const).map(lvl =>
                stats.counts[lvl] > 0 ? (
                  <span key={lvl} className="px-1.5 py-0.5 rounded" style={{
                    backgroundColor: getBgColor(lvl),
                    color: getColor(lvl),
                  }}>
                    {stats.counts[lvl]} {lvl}
                  </span>
                ) : null
              )}
            </div>
            {node.data.children && (
              <div className="text-[10px] opacity-40 mt-2">Click to drill down →</div>
            )}
          </div>
        ),
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!tooltip || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip(prev => prev ? {
      ...prev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    } : null);
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="bg-vscode-bg border border-vscode-border p-6 rounded-2xl shadow-biggest animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4 border-l-4 border-vscode-chart-blue pl-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Risk Treemap</h3>
          <p className="text-[0.65rem] opacity-40 mt-0.5">
            Tile size = danger score · Color = danger level · Click directories to drill down
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[0.6rem] uppercase tracking-tighter opacity-40 font-black">Danger Level</span>
            <div className="flex gap-1 h-3 items-center">
              {(['safe', 'low', 'medium', 'high', 'critical'] as const).map(lvl => (
                <div
                  key={lvl}
                  className="flex items-center gap-0.5"
                  title={lvl}
                >
                  <div className="w-5 h-full rounded-sm" style={{ backgroundColor: dangerColors[lvl], opacity: 0.8 }} />
                  <span className="text-[8px] opacity-30 hidden sm:inline">{lvl[0].toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-3 text-xs flex-wrap">
        <button
          onClick={() => handleBreadcrumbClick(0)}
          className={`px-2 py-0.5 rounded transition-colors ${
            zoomPath.length === 0
              ? 'bg-vscode-button text-vscode-button-fg'
              : 'bg-vscode-sidebar hover:bg-vscode-hover opacity-70'
          }`}
        >
          root
        </button>
        {zoomPath.map((seg, i) => (
          <React.Fragment key={i}>
            <span className="opacity-30">/</span>
            <button
              onClick={() => handleBreadcrumbClick(i + 1)}
              className={`px-2 py-0.5 rounded transition-colors ${
                i === zoomPath.length - 1
                  ? 'bg-vscode-button text-vscode-button-fg'
                  : 'bg-vscode-sidebar hover:bg-vscode-hover opacity-70'
              }`}
            >
              {seg}
            </button>
          </React.Fragment>
        ))}
        {zoomPath.length > 0 && (
          <button
            onClick={() => setZoomPath(prev => prev.slice(0, -1))}
            className="ml-2 text-[10px] opacity-40 hover:opacity-80 transition-opacity"
            title="Go up one level"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Treemap */}
      <div
        ref={containerRef}
        className="relative bg-vscode-sidebar/20 rounded-xl overflow-hidden border border-vscode-border/30"
        style={{ height: dimensions.height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Directory / file tiles */}
        {tiles.map((node, i) => {
          const w = (node.x1 || 0) - (node.x0 || 0);
          const h = (node.y1 || 0) - (node.y0 || 0);
          if (w < 1 || h < 1) return null;

          const isDir = !!node.data.children;
          const isLeaf = !!node.data.file;
          const level = isLeaf ? node.data.dangerLevel : getDirStats(node).worst;
          const color = getColor(level);

          // For directories, render their leaves inside
          if (isDir) {
            const leaves = node.leaves();
            return (
              <div
                key={`dir-${i}`}
                className="absolute transition-all duration-300 ease-out rounded-lg cursor-pointer group"
                style={{
                  left: node.x0,
                  top: node.y0,
                  width: w,
                  height: h,
                  border: `1px solid rgba(255,255,255,0.06)`,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
                onClick={() => handleTileClick(node.data.name)}
                onMouseEnter={(e) => handleMouseEnter(e, node)}
              >
                {/* Directory label */}
                {w > 40 && (
                  <div
                    className="absolute top-0 left-0 right-0 px-1.5 py-0.5 text-[10px] font-semibold truncate z-10 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
                      color: 'rgba(255,255,255,0.7)',
                      borderRadius: '8px 8px 0 0',
                    }}
                  >
                    {node.data.name}/
                    <span className="opacity-40 ml-1 font-normal">({leaves.length})</span>
                  </div>
                )}

                {/* Render leaf children inside */}
                {node.children?.map((child, j) => {
                  const cw = (child.x1 || 0) - (child.x0 || 0);
                  const ch = (child.y1 || 0) - (child.y0 || 0);
                  if (cw < 2 || ch < 2) return null;

                  const childIsDir = !!child.data.children;
                  const childLevel = childIsDir
                    ? getDirStats(child as d3.HierarchyRectangularNode<TreeNode>).worst
                    : child.data.dangerLevel;
                  const childColor = getColor(childLevel);

                  // Recursively render sub-directories as colored blocks
                  if (childIsDir) {
                    const subLeaves = child.leaves();
                    return (
                      <div
                        key={`subdir-${j}`}
                        className="absolute rounded-md cursor-pointer transition-all duration-200 hover:brightness-125"
                        style={{
                          left: (child.x0 || 0) - (node.x0 || 0),
                          top: (child.y0 || 0) - (node.y0 || 0),
                          width: cw,
                          height: ch,
                          backgroundColor: getBgColor(childLevel),
                          border: `1px solid ${childColor}22`,
                        }}
                        onClick={(e) => { e.stopPropagation(); handleTileClick(node.data.name, child.data.name); }}
                        onMouseEnter={(e) => { e.stopPropagation(); handleMouseEnter(e, child as d3.HierarchyRectangularNode<TreeNode>); }}
                      >
                        {cw > 35 && ch > 14 && (
                          <div className="px-1 py-0.5 text-[8px] truncate pointer-events-none font-medium" style={{ color: childColor }}>
                            {child.data.name}/
                            <span className="opacity-50 ml-0.5">({subLeaves.length})</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`leaf-${j}`}
                      className="absolute rounded-[3px] transition-all duration-200 hover:brightness-150 hover:z-10 cursor-default"
                      style={{
                        left: (child.x0 || 0) - (node.x0 || 0),
                        top: (child.y0 || 0) - (node.y0 || 0),
                        width: cw,
                        height: ch,
                        backgroundColor: childColor,
                        opacity: 0.25 + (child.data.dangerScore || 0) / 140,
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => { e.stopPropagation(); handleMouseEnter(e, child as d3.HierarchyRectangularNode<TreeNode>); }}
                    >
                      {cw > 40 && ch > 16 && (
                        <div className="px-1 py-0.5 text-[8px] truncate pointer-events-none font-medium" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                          {child.data.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }

          // Top-level leaf file (root has no directories, just files)
          return (
            <div
              key={`file-${i}`}
              className="absolute rounded-md transition-all duration-200 hover:brightness-150 hover:z-10"
              style={{
                left: node.x0,
                top: node.y0,
                width: w,
                height: h,
                backgroundColor: color,
                opacity: 0.3 + (node.data.dangerScore || 0) / 140,
              }}
              onMouseEnter={(e) => handleMouseEnter(e, node)}
            >
              {w > 40 && h > 16 && (
                <div className="px-1.5 py-0.5 text-[9px] truncate pointer-events-none font-medium" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  {node.data.name}
                </div>
              )}
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-50 max-w-[280px]"
            style={{
              left: Math.min(tooltip.x + 12, dimensions.width - 290),
              top: tooltip.y < dimensions.height / 2 ? tooltip.y + 12 : tooltip.y - 160,
            }}
          >
            <div className="bg-[rgba(15,23,42,0.95)] backdrop-blur-md text-white p-3 rounded-lg border border-white/10 shadow-2xl text-xs">
              {tooltip.content}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tiles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-40 text-sm">
            No files to display
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex gap-4 mt-3 text-[10px] opacity-40">
        <span>{files.length} total files</span>
        <span>·</span>
        <span>{files.filter(f => f.dangerLevel === 'critical').length} critical</span>
        <span>{files.filter(f => f.dangerLevel === 'high').length} high</span>
        <span>{files.filter(f => f.dangerLevel === 'medium').length} medium</span>
      </div>
    </div>
  );
};

export default HeatmapGraph;
