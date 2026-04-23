import { ForbiddenFile, ScoredFile } from "../utils/types";
import { getConfig } from "../config";

export function detectForbiddenFiles(files: ScoredFile[]): ForbiddenFile[] {
  const cnfg = getConfig();   // reads live from VS Code settings

  const forbidden: ForbiddenFile[] = [];

  for (const file of files) {
    const reasons: string[] = [];
    let forbiddenScore = 0;

    // Check 1 - Stale and untouched
    if (file.daysSinceLastCommit >= cnfg.minDaysSinceTouch) {
      reasons.push(
        `Untouched for ${file.daysSinceLastCommit} days — knowledge may be lost`,
      );
      forbiddenScore += 25;
    }

    // Check 2 — Bus factor risk
    if (
      file.uniqueAuthors.length <= cnfg.maxAuthors &&
      file.totalCommits >= cnfg.minCommits
    ) {
      const authorWord =
        file.uniqueAuthors.length === 1 ? "person has" : "people have";
      reasons.push(
        `Only ${file.uniqueAuthors.length} ${authorWord} ever touched this file`,
      );
      forbiddenScore += 30;
    }

    // Check 3 — Bug magnet
    if (
      file.bugFixRatio >= cnfg.minBugFixRatio &&
      file.bugFixCommits >= 3
    ) {
      reasons.push(
        `${Math.round(file.bugFixRatio * 100)}% of commits are bug fixes (${file.bugFixCommits} total)`,
      );
      forbiddenScore += 25;
    }

    // Check 4 — Single owner who may have left
    if (file.uniqueAuthors.length === 1) {
      reasons.push(
        `Single author: ${file.uniqueAuthors[0]} — no backup knowledge`,
      );
      forbiddenScore += 20;
    }

    // Only flag if it meets minimum danger threshold and has at least 2 reasons
    if (
      reasons.length >= 2 &&
      file.dangerScore >= cnfg.minDangerScore &&
      file.totalCommits >= cnfg.minCommits
    ) {
      forbidden.push({
        file,
        reasons,
        forbiddenScore: Math.min(100, forbiddenScore),
      });
    }
  }

  // Sort by forbidden score descending
  return forbidden.sort((a, b) => b.forbiddenScore - a.forbiddenScore);
}
