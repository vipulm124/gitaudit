import type { FileMetrics } from "../utils/types";
import type { ScoredFile } from "../utils/types";
import { getConfig } from "../config";


// 0 days → 0 pts (fresh)   |   365+ days → 100 pts (stale)
function scoreRecency(daysSince: number): number {
  return Math.min(100, Math.round((daysSince / 365) * 100));
}

// 1 author → 100 pts (bus factor risk)   |   10+ authors → 0 pts
function scoreOwnership(authorCount: number): number {
  if (authorCount <= 1) return 100;
  if (authorCount >= 10) return 0;

  return Math.round(((10 - authorCount) / 9) * 100);
}

// High bug-fix ratio + high raw count → high score
function scoreBugMagnet(ratio: number, rawCount: number): number {
  const ratioScore = ratio * 100;
  const countScore = Math.min(100, (rawCount / 20) * 100);

  return Math.round(ratioScore * 0.6 + countScore * 0.4);
}

// Very high churn on a young file = risky   |   steady commits on old file = ok
function scoreChurnRate(totalCommit: number, ageInDays: number): number {
  if (ageInDays === 0) return 0;
  const commitsPerMonth = (totalCommit / ageInDays) * 30;
  return Math.min(100, Math.round(commitsPerMonth * 10));
}

function getDangerLevel(score: number): ScoredFile["dangerLevel"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";

  return "safe";
}

function checkIfExcludedfile(file: FileMetrics): boolean {
  const { exceptionFiles } = getConfig();

  const fileName = file.path.split("/").pop();
  if (fileName) {
    return exceptionFiles.includes(fileName);
  }
  return false;
}

export function scoreFiles(files: FileMetrics[]): ScoredFile[] {
  const { dangerScoreWeights: W } = getConfig();
  return files.map((file) => {
    const breakdown = {
      recency: scoreRecency(file.daysSinceLastCommit),
      ownership: scoreOwnership(file.uniqueAuthors.length),
      bugMagnet: scoreBugMagnet(file.bugFixRatio, file.bugFixCommits),
      churnRate: scoreChurnRate(file.totalCommits, file.ageInDays),
    };

    let dangerScore = Math.round(
      breakdown.recency * W.recency +
        breakdown.churnRate * W.churnRate +
        breakdown.bugMagnet * W.bugMagnet +
        breakdown.ownership * W.ownership,
    );

    if (checkIfExcludedfile(file)) {
      dangerScore = 10;
      return {
        ...file,
        dangerScore,
        dangerLevel: getDangerLevel(dangerScore),
        scoreBreakdown: breakdown,
      };
    }

    return {
      ...file,
      dangerScore,
      dangerLevel: getDangerLevel(dangerScore),
      scoreBreakdown: breakdown,
    };
  });
}
