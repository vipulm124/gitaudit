import type { AuthorContribution } from "../utils/types";
import type { FileBlame } from "../utils/types";
import { getConfig } from "../config";
import { execSync } from "child_process";

const { bugFixKeywords, featureKeywords, refactorKeywords} = getConfig()

function classifyCommit(msg: string): FileBlame["recentCommits"][0]["type"] {
  const lower = msg.toLowerCase();

  if (bugFixKeywords.some((k) => lower.includes(k))) return "bug";
  if (featureKeywords.some((k) => lower.includes(k))) return "feature";
  if (refactorKeywords.some((k) => lower.includes(k))) return "refactor";
  return "other";
}

export function getFileBlame(
  repoPath: string,
  filePath: string,
  maxCommits: number = 20,
): FileBlame {
  const raw = execSync(
    `git log --follow --format="%H|%an|%aI|%s" -n ${maxCommits} -- "${filePath}"`,
    { cwd: repoPath, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );

  const lines = raw.trim().split("\n").filter(Boolean);
  const authorMap = new Map<string, number>();
  const recentCommits: FileBlame["recentCommits"] = [];

  for (const line of lines) {
    const [hash, author, date, ...msgParts] = line.split("|");
    const message = msgParts.join("|");
    authorMap.set(author, (authorMap.get(author) ?? 0) + 1);
    recentCommits.push({
      hash: hash?.slice(0, 7) ?? "",
      author: author ?? "",
      date: date ?? "",
      message: message ?? "",
      type: classifyCommit(message ?? ""),
    });
  }

  const total = lines.length;
  const authors: AuthorContribution[] = Array.from(authorMap.entries())
    .map(([author, commits]) => ({
      author,
      commits,
      percentage: Math.round((commits / total) * 100),
    }))
    .sort((a, b) => b.commits - a.commits);

  return { filePath, totalCommits: total, authors, recentCommits };
}
