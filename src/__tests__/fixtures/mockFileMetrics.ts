import type { FileMetrics } from '../../utils/types';

const now = new Date();

function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * 86_400_000);
}

/** Fresh, safe file — many authors, recent commits, no bugs */
export const safeFile: FileMetrics = {
  path: 'src/utils/helpers.ts',
  totalCommits: 50,
  uniqueAuthors: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'],
  lastCommitDate: daysAgo(5),
  daysSinceLastCommit: 5,
  firstCommitDate: daysAgo(400),
  ageInDays: 400,
  bugFixCommits: 0,
  bugFixRatio: 0,
};

/** Stale, single-author, bug-heavy file — should be critical */
export const criticalFile: FileMetrics = {
  path: 'src/legacy/payment.ts',
  totalCommits: 30,
  uniqueAuthors: ['Alice'],
  lastCommitDate: daysAgo(400),
  daysSinceLastCommit: 400,
  firstCommitDate: daysAgo(800),
  ageInDays: 800,
  bugFixCommits: 20,
  bugFixRatio: 0.67,
};

/** Medium risk file */
export const mediumFile: FileMetrics = {
  path: 'src/api/routes.ts',
  totalCommits: 15,
  uniqueAuthors: ['Alice', 'Bob', 'Charlie'],
  lastCommitDate: daysAgo(100),
  daysSinceLastCommit: 100,
  firstCommitDate: daysAgo(300),
  ageInDays: 300,
  bugFixCommits: 3,
  bugFixRatio: 0.20,
};

/** Excluded file (package.json) */
export const excludedFile: FileMetrics = {
  path: 'package.json',
  totalCommits: 80,
  uniqueAuthors: ['Alice', 'Bob'],
  lastCommitDate: daysAgo(200),
  daysSinceLastCommit: 200,
  firstCommitDate: daysAgo(500),
  ageInDays: 500,
  bugFixCommits: 10,
  bugFixRatio: 0.125,
};

/** Young, high-churn file */
export const highChurnFile: FileMetrics = {
  path: 'src/new/feature.ts',
  totalCommits: 100,
  uniqueAuthors: ['Alice', 'Bob'],
  lastCommitDate: daysAgo(1),
  daysSinceLastCommit: 1,
  firstCommitDate: daysAgo(10),
  ageInDays: 10,
  bugFixCommits: 5,
  bugFixRatio: 0.05,
};

/** File with zero age (created today) */
export const zeroAgeFile: FileMetrics = {
  path: 'src/brand-new.ts',
  totalCommits: 1,
  uniqueAuthors: ['Alice'],
  lastCommitDate: now,
  daysSinceLastCommit: 0,
  firstCommitDate: now,
  ageInDays: 0,
  bugFixCommits: 0,
  bugFixRatio: 0,
};

export const allFiles: FileMetrics[] = [
  safeFile, criticalFile, mediumFile, excludedFile, highChurnFile, zeroAgeFile,
];
