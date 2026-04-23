import * as vscode from "vscode";

export interface GitAuditConfig {
  minDaysSinceTouch: number;
  maxAuthors: number;
  minCommits: number;
  minBugFixRatio: number;
  minDangerScore: number;
  dangerScoreWeights: {
    recency: number;
    ownership: number;
    bugMagnet: number;
    churnRate: number;
  };
  cacheTTLHours: number;
  bugFixKeywords: string[];
  refactorKeywords: string[];
  featureKeywords: string[];
  exceptionFiles: string[];
}

export function getConfig(): GitAuditConfig {
  const cnfg = vscode.workspace.getConfiguration("gitaudit");
  return {
    minDaysSinceTouch: cnfg.get<number>("minDaysSinceTouch", 60),
    maxAuthors: cnfg.get<number>("maxAuthors", 3),
    minCommits: cnfg.get<number>("minCommits", 10),
    minBugFixRatio: cnfg.get<number>("minBugFixRatio", 0.15),
    minDangerScore: cnfg.get<number>("minDangerScore", 40),
    cacheTTLHours: cnfg.get<number>("cacheTTLHours", 24),
    bugFixKeywords: cnfg.get<string[]>("bugFixKeywords", [
      "bug",
      "fix",
      "patch",
      "hotfix",
      "crash",
      "error",
    ]),
    dangerScoreWeights: cnfg.get("dangerScoreWeights", {
      recency: 0.3,
      ownership: 0.25,
      bugMagnet: 0.3,
      churnRate: 0.15,
    }),
    refactorKeywords: cnfg.get<string[]>("refactorKeywords", [
      "refactor",
      "cleanup",
      "clean up",
      "restructure",
    ]),
    featureKeywords: cnfg.get<string[]>("featureKeywords", [
      "feature",
      "feat",
      "add",
      "new",
      "implement",
      "support",
    ]),
    exceptionFiles: cnfg.get<string[]>("exceptionFiles", [
      "Dockerfile",
      "package.json",
      "package-lock.json",
    ]),
  };
}
