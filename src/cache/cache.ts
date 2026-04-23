import * as fs from "fs";
import * as path from "path";
import type { RepoMetrics } from "../utils/types";
import type { ScoredFile } from "../utils/types";
import type { ForbiddenFile } from "../utils/types";
import type { CachedReport } from "../utils/types";
import type { AuthorStats } from "../utils/types";
import { getConfig } from "../config";

import { CACHE_VERSION } from "../utils/constants";

function getCachePath(repoPath: string): string {
  return path.join(repoPath, ".vscode", "archaeologist-cache.json");
}

export function saveCache(
  repoPath: string,
  currentBranch: string,
  metrics: RepoMetrics,
  scoredFiles: ScoredFile[],
  forbiddenFiles: ForbiddenFile[],
  authorStats: AuthorStats[],
): void {
  const cacheDir = path.join(repoPath, ".vscode");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const report: CachedReport = {
    version: CACHE_VERSION,
    repoPath,
    currentBranch,
    analyzedAt: new Date().toISOString(),
    metrics,
    scoredFiles,
    forbiddenFiles,
    authorStats,
  };

  fs.writeFileSync(getCachePath(repoPath), JSON.stringify(report, null, 2));
}

export function loadCache(repoPath: string): CachedReport | null {
  const { cacheTTLHours } = getConfig()

  const cachePath = getCachePath(repoPath);
  if (!fs.existsSync(cachePath)) return null;

  try {
    const raw = fs.readFileSync(cachePath, "utf-8");
    const report: CachedReport = JSON.parse(raw);

    // Version mismatch — invalidate
    if (report.version !== CACHE_VERSION) return null;

    // TTL check
    const analyzedAt = new Date(report.analyzedAt);
    const hoursSince = (Date.now() - analyzedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > cacheTTLHours) return null;

    return report;
  } catch {
    return null;
  }
}

export function clearCache(repoPath: string): void {
  const cachePath = getCachePath(repoPath);
  if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
}

export function isCacheValid(repoPath: string): boolean {
  return loadCache(repoPath) !== null;
}
