import React, { useState, useEffect, useMemo } from "react";
import type { FileMetric } from "../utils/types";
import type { ForbiddenFile } from "../utils/types";
import type { AuthorStat } from "../utils/types";
import type { AuditData } from "../utils/types";
import HeatmapGraph from "./components/HeatmapGraph";
import FileMetricsDisplay from "./components/FileMetricsDisplay";
import ForbiddenFilesDisplay from "./components/ForbiddenFilesDisplay";
import AuthorStatDisplay from "./components/AuthorStatDisplay";

function App() {
  const [data, setData] = useState<AuditData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"commits" | "age">("commits");
  const [activeTab, setActiveTab] = useState<
    "files" | "forbidden" | "authors" | "heatmap"
  >("heatmap");
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null);

  // VS Code Webview API global singleton (memoized)
  const vscode = useMemo(() => {
    try {
      return (window as any).acquireVsCodeApi();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Restore state if available
    const previousState = vscode?.getState();
    if (previousState?.data) {
      setData(previousState.data);
    }

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "DATA_LOADED") {
        setData(message.data);
        vscode?.setState({ data: message.data });
      }
    };

    window.addEventListener("message", handleMessage);

    // Announce ready to the extension to trigger data push
    vscode?.postMessage({ type: "READY" });

    return () => window.removeEventListener("message", handleMessage);
  }, [vscode]);

  const filteredFiles = useMemo(() => {
    if (!data) return [];
    let files = data.metrics.files.filter((f) =>
      f.path.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    files.sort((a, b) => {
      if (sortBy === "commits") return b.totalCommits - a.totalCommits;
      if (sortBy === "age")
        return b.daysSinceLastCommit - a.daysSinceLastCommit;
      return a.path.localeCompare(b.path);
    });

    return files;
  }, [data, searchTerm, sortBy]);

  const filteredAuthors = useMemo(() => {
    if (!data) return [];
    const term = searchTerm.toLowerCase();
    return data.authorStats
      .filter(
        (a) =>
          a.author.toLowerCase().includes(term) ||
          a.files.some((f) => f.toLowerCase().includes(term)),
      )
      .sort((a, b) => b.commitCounts - a.commitCounts);
  }, [data, searchTerm]);

  const filteredForbidden = useMemo(() => {
    if (!data) return [];
    return data.forbiddenFiles
      .filter((f) =>
        f.file.path.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => b.forbiddenScore - a.forbiddenScore);
  }, [data, searchTerm]);

  if (!data) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-vscode-hover border-t-vscode-chart-blue rounded-full animate-spin"></div>
        <p className="text-vscode-fg opacity-60">
          Loading project archaeological data...
        </p>
      </div>
    );
  }

  const toggleAuthor = (email: string) => {
    setExpandedAuthor(expandedAuthor === email ? null : email);
  };

  return (
    <div className="p-6 h-screen overflow-y-auto flex flex-col gap-6 scrollbar-hide">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold m-0 p-0">GitAudit</h1>
          <span className="bg-vscode-sidebar text-[0.7rem] px-2 py-0.5 rounded border border-vscode-border opacity-70">
            v{data.version}
          </span>
            <button 
              onClick={() => vscode?.postMessage({ type: "RUN_ANALYZER" })}
              className="ml-auto text-2xl bg-green-500 text-white px-5 py-2 rounded-lg"
            >
              Re-run audit
            </button>
        </div>
        <p className="font-mono text-xs mb-4 truncate">
          <span className="font-bold">Analysis ran on branch:</span>{" "}
          {data.currentBranch}
        </p>
        <p className="font-mono text-xs mb-4 truncate">
          <span className="font-bold">Last Analyzed on:</span>{" "}
          {new Date(data.analyzedAt).toLocaleString()}
        </p>
        <p className="font-mono text-xs opacity-50 mb-4 truncate">
          {data.repoPath}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Commits", value: data.metrics.totalCommits },
            { label: "Files Tracked", value: data.metrics.totalFiles },
            { label: "Contributors", value: data.metrics.uniqueAuthors.length },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-vscode-sidebar border border-vscode-border p-4 rounded-lg shadow-sm flex flex-col"
            >
              <span className="text-2xl font-bold text-vscode-chart-blue leading-none">
                {stat.value}
              </span>
              <span className="text-[0.65rem] uppercase tracking-wider opacity-60 mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <nav className="flex gap-4 border-b border-vscode-border -mb-2 z-20 bg-vscode-bg sticky -top-6 pt-2">
        {[
          { id: "heatmap", label: "HeatMap", count: 0 },
          { id: "files", label: "File Metrics", count: 0 },
          {
            id: "forbidden",
            label: "Forbidden",
            count: data.forbiddenFiles?.length || 0,
          },
          { id: "authors", label: "Authors", count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSearchTerm("");
            }}
            className={`pb-3 px-1 text-sm relative transition-opacity hover:opacity-100 ${
              activeTab === tab.id ? "font-bold opacity-100" : "opacity-60"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 bg-vscode-chart-red text-white text-[0.6rem] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-vscode-focus" />
            )}
          </button>
        ))}
      </nav>

      <main className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {activeTab !== "heatmap" && (
            <input
              type="text"
              placeholder={
                activeTab === "authors"
                  ? "Filter contributors or files..."
                  : "Filter paths..."
              }
              className="bg-vscode-input text-vscode-input-fg border border-vscode-border px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-vscode-focus"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
          {activeTab === "files" && (
            <div className="flex gap-2 mb-2">
              {[
                { id: "commits", label: "Commits" },
                { id: "age", label: "Age" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSortBy(btn.id as any)}
                  className={`text-[0.7rem] px-3 py-1 rounded transition-colors ${
                    sortBy === btn.id
                      ? "bg-vscode-button text-vscode-button-fg"
                      : "bg-vscode-sidebar opacity-70 hover:bg-vscode-hover"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {activeTab === "heatmap" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <HeatmapGraph files={data.scoredFiles} />
            </div>
          )}

          {activeTab === "files" && (
            <FileMetricsDisplay
              filteredFiles={filteredFiles}
              totalCommits={data.metrics.totalCommits}
            />
          )}

          {activeTab === "forbidden" && (
            <ForbiddenFilesDisplay filteredForbidden={filteredForbidden} />
          )}

          {activeTab === "authors" && (
            <AuthorStatDisplay
              filteredAuthors={filteredAuthors}
              expandedAuthor={expandedAuthor}
              searchTerm={searchTerm}
              toggleAuthor={toggleAuthor}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
