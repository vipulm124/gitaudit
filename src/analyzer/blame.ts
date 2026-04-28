import type { AuthorContribution } from "../utils/types";
import type { FileBlame } from "../utils/types";
import { getConfig } from "../config";
import { execSync } from "child_process";
import * as vscode from "vscode";

function classifyCommit(msg: string): FileBlame["recentCommits"][0]["type"] {
  const { bugFixKeywords, featureKeywords, refactorKeywords } = getConfig();
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
  try {
    const sep = String.fromCharCode(31);
    const cmd = `git log -n ${maxCommits} --format="${sep}COMMIT${sep}%H${sep}%an${sep}%ae${sep}%aI${sep}%s" -- "${filePath}"`;
    const raw = execSync(cmd, { cwd: repoPath, encoding: 'utf-8' });

    const blocks = raw.split(`${sep}COMMIT${sep}`).filter(b => b.trim());
    const authorMap = new Map<string, number>();
    const recentCommits: FileBlame["recentCommits"] = [];

    for (const block of blocks) {
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length < 1) continue;
        
        const [hash, author, email, dateStr, ...subjectParts] = lines[0].split(sep);
        const subject = subjectParts.join(sep);
        const date = new Date(dateStr);

        authorMap.set(author, (authorMap.get(author) || 0) + 1);
        recentCommits.push({
            hash,
            author,
            date,
            subject,
            type: classifyCommit(subject)
        });
    }

    const total = Array.from(authorMap.values()).reduce((a, b) => a + b, 0);
    const authorContributions: AuthorContribution[] = Array.from(authorMap.entries())
      .map(([author, count]) => ({
        author,
        commits: count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.commits - a.commits);

    return {
      authorContributions,
      recentCommits,
    };
  } catch (e) {
    return {
      authorContributions: [],
      recentCommits: [],
    };
  }
}
