
import type { AuthorStats } from "../utils/types";
import { execSync } from "child_process";

export function createAuthorChart(
  repoPath: string,
  filePath?: string,
): AuthorStats[] {
  try {
    // Use similar approach to gitEngine with field separator
    const raw = execSync(
      `git log --name-only --format="\x1fAUTHOR\x1f%an\x1f%ae" HEAD${filePath ? ` -- "${filePath}"` : ''}`,
      {
        cwd: repoPath,
        encoding: "utf-8",
        maxBuffer: 100 * 1024 * 1024,
      }
    );

    // Parse the output
    const blocks = raw.split('\x1fAUTHOR\x1f').filter(b => b.trim());
    const authorMap = new Map<
      string,
      { email: string; commits: number; files: Set<string> }
    >();

    for (const block of blocks) {
      const lines = block.split('\n').filter(l => l.trim());
      if (lines.length < 1) continue;

      // First line: author\x1femail
      const [author, email, ...rest] = lines[0].split('\x1f');
      
      if (!author || !email) continue;

      if (!authorMap.has(author)) {
        authorMap.set(author, {
          email,
          commits: 0,
          files: new Set(),
        });
      }

      const stats = authorMap.get(author)!;
      stats.commits++;

      // Remaining lines are changed file paths
      const fileLines = lines.slice(1).filter(l =>
        l.trim().length > 0 &&
        !l.startsWith('commit') &&
        !l.startsWith('Author')
      );

      for (const filePath of fileLines) {
        if (filePath.trim()) {
          stats.files.add(filePath.trim());
        }
      }
    }

    // Convert map to array of AuthorStats
    const result: AuthorStats[] = Array.from(authorMap.entries()).map(
      ([author, data]) => ({
        author,
        authorEmail: data.email,
        commitCounts: data.commits,
        files: Array.from(data.files),
      }),
    );

    // Sort by commit count descending
    return result.sort((a, b) => b.commitCounts - a.commitCounts);
  } catch (error: any) {
    console.error(
      `Failed to get author stats for ${filePath || "repository"}:`,
      error.message,
    );
    return [];
  }
}