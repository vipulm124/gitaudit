import { execSync } from 'child_process';
import * as path from 'path';
import type { FileMetrics } from '../utils/types';
import type { RepoMetrics } from '../utils/types';
import { getConfig } from '../config';

const { bugFixKeywords } = getConfig();


function isBugFix(message: string): boolean {
  const lower = message.toLowerCase();
  return bugFixKeywords.some(k => lower.includes(k));
}

function git(repoPath: string, args: string[]): string {
  try {
    return execSync(`git ${args.join(' ')}`, {
      cwd: repoPath,
      encoding: 'utf-8',
      maxBuffer: 100 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (e: any) {
    throw new Error(`git command failed: git ${args.join(' ')}\n${e.message}`);
  }
}

export function isGitRepo(repoPath: string): boolean {
  try {
    git(repoPath, ['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

export function getCurrentBranch(repoPath: string): string {
  if (!isGitRepo(repoPath)) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }
  return git(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
}

export async function analyzeRepo(
  repoPath: string,
  onProgress?: (message: string, current: number, total: number) => void
): Promise<RepoMetrics> {

  if (!isGitRepo(repoPath)) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  // Step 1 — get total commit count for progress reporting
  onProgress?.('Counting commits...', 0, 1);
  const totalCommits = parseInt(
    git(repoPath, ['rev-list', '--count', 'HEAD']).trim(), 10
  );

  // Step 2 — pull full log: hash|author|email|date|subject + blank line + files
  // --name-only gives us filenames after each commit block
  // \x1f is a field separator safe from appearing in commit messages
  onProgress?.('Reading commit history...', 0, totalCommits);

  const raw = git(repoPath, [
    'log',
    '--name-only',
    '--format=\x1fCOMMIT\x1f%H\x1f%an\x1f%ae\x1f%aI\x1f%s',
    'HEAD'
  ]);

  // Step 3 — parse the raw log into commit blocks
  onProgress?.('Parsing commits...', 0, totalCommits);

  const fileMap = new Map<string, {
    authors: Set<string>;
    dates: Date[];
    bugFixes: number;
    commitHashes: Set<string>;
  }>();

  const allAuthors  = new Set<string>();
  const allDates: Date[] = [];

  // Split on our sentinel to get per-commit blocks
  const blocks = raw.split('\x1fCOMMIT\x1f').filter(b => b.trim());
  let processed = 0;

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) continue;

    // First line is: hash\x1fauthor\x1femail\x1fdate\x1fsubject
    const headerParts = lines[0].split('\x1f');
    if (headerParts.length < 5) continue;

    // console.log("headerParts: ",headerParts)

    const [hash, author, email , dateStr, ...subjectParts] = headerParts;
    const subject = subjectParts.join('\x1f');
    const date    = new Date(dateStr);
    const isBug   = isBugFix(subject);

    allAuthors.add(author);
    allDates.push(date);

    // Remaining lines are changed filenames (from --name-only)
    const changedFiles = lines.slice(1).filter(l =>
      l.length > 0 &&
      !l.startsWith('commit') &&
      !l.startsWith('Author') &&
      !l.startsWith('Date')
    );

    for (const filePath of changedFiles) {
      const normalised = filePath.replace(/\\/g, '/').trim();
      if (!normalised) continue;

      if (!fileMap.has(normalised)) {
        fileMap.set(normalised, {
          authors:       new Set(),
          dates:         [],
          bugFixes:      0,
          commitHashes:  new Set(),
        });
      }

      const entry = fileMap.get(normalised)!;
      entry.authors.add(author);
      entry.dates.push(date);
      entry.commitHashes.add(hash);
      if (isBug) entry.bugFixes++;
    }

    processed++;
    if (processed % 200 === 0) {
      onProgress?.('Parsing commits...', processed, totalCommits);
    }
  }

  // Step 4 — get tracked files (excludes .gitignore'd files)
  onProgress?.('Checking tracked files...', 0, 1);
  const trackedRaw = git(repoPath, ['ls-files']);
  const trackedFiles = new Set(
    trackedRaw.split('\n').map(f => f.trim().replace(/\\/g, '/')).filter(Boolean)
  );

  // Step 5 — compute per-file metrics
  onProgress?.('Computing file metrics...', 0, fileMap.size);

  const now   = new Date();
  const files: FileMetrics[] = [];
  let idx = 0;

  for (const [filePath, data] of fileMap.entries()) {
    // Skip files not currently tracked (deleted or in .gitignore)
    if (!trackedFiles.has(filePath)) {
      continue;
    }

    const sorted         = [...data.dates].sort((a, b) => a.getTime() - b.getTime());
    const firstCommitDate = sorted[0];
    const lastCommitDate  = sorted[sorted.length - 1];

    const daysSinceLastCommit = Math.floor(
      (now.getTime() - lastCommitDate.getTime()) / 86_400_000
    );
    const ageInDays = Math.floor(
      (now.getTime() - firstCommitDate.getTime()) / 86_400_000
    );
    const totalFileCommits = data.commitHashes.size;
    const bugFixRatio = totalFileCommits > 0
      ? Math.round((data.bugFixes / totalFileCommits) * 100) / 100
      : 0;

    files.push({
      path: filePath,
      totalCommits:        totalFileCommits,
      uniqueAuthors:       Array.from(data.authors),
      lastCommitDate,
      daysSinceLastCommit,
      firstCommitDate,
      ageInDays,
      bugFixCommits:       data.bugFixes,
      bugFixRatio,
    });

    idx++;
    if (idx % 100 === 0) {
      onProgress?.('Computing file metrics...', idx, fileMap.size);
    }
  }

  onProgress?.('Done!', fileMap.size, fileMap.size);

  const sortedDates = [...allDates].sort((a, b) => a.getTime() - b.getTime());

  return {
    repoPath,
    totalCommits,
    totalFiles: files.length,
    uniqueAuthors: Array.from(allAuthors),
    firstCommit:   sortedDates[0],
    lastCommit:    sortedDates[sortedDates.length - 1],
    files,
  };
}


// const repoPath = "/Users/vipulmalhotra/Documents/source/repo/receipt_manage"

// analyzeRepo(repoPath).then(result => 
// {
//     // console.log(result.files.length);
//     console.log(result)
// }
// )


