
export interface FileMetric {
  path: string;
  totalCommits: number;
  uniqueAuthors: string[];
  lastCommitDate: string;
  daysSinceLastCommit: number;
  firstCommitDate: string;
  ageInDays: number;
  bugFixCommits: number;
  bugFixRatio: number;
  dangerScore?: number;
  dangerLevel?: string;
}

export interface ForbiddenFile {
  file: FileMetric;
  reasons: string[];
  forbiddenScore: number;
}

export interface AuthorStat {
  author: string;
  authorEmail: string;
  commitCounts: number;
  files: string[];
}

export interface AuditData {
  version: string;
  repoPath: string;
  currentBranch: string;
  analyzedAt: string;
  metrics: {
    totalCommits: number;
    totalFiles: number;
    uniqueAuthors: string[];
    files: FileMetric[];
  };
  forbiddenFiles: ForbiddenFile[];
  authorStats: AuthorStat[];
  scoredFiles: ScoredFile[];
}
export interface FileMetrics {
  path: string;
  totalCommits: number;
  uniqueAuthors: string[];
  lastCommitDate: Date;
  daysSinceLastCommit: number;
  firstCommitDate: Date;
  ageInDays: number;
  bugFixCommits: number;
  bugFixRatio: number;
}


export interface RepoMetrics {
  repoPath: string;
  totalCommits: number;
  totalFiles: number;
  uniqueAuthors: string[];
  firstCommit: Date;
  lastCommit: Date;
  files: FileMetrics[];
}

export interface ScoredFile extends FileMetrics {
  dangerScore: number;       // 0–100
  dangerLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  scoreBreakdown: {
    recency: number;         // How long since last touched
    ownership: number;       // How few authors own it
    bugMagnet: number;       // How often it appears in bug fixes
    churnRate: number;       // Commits relative to file age
  };
}


export interface AuthorContribution{
  author: string;
  commits: number;
  percentage: number;
}


export interface FileBlame {
  filePath: string;
  totalCommits: number;
  authors: AuthorContribution[];
  recentCommits: {
    hash: string;
    author: string;
    date: string;
    message: string;
    type: 'bug' | 'feature' | 'refactor' | 'other';
  }[];
}


export interface ForbiddenFile {
  file: ScoredFile;
  reasons: string[];
  forbiddenScore: number
}

export interface CachedReport {
  version: string;
  repoPath: string;
  currentBranch: string;
  analyzedAt: string;
  metrics: RepoMetrics;
  scoredFiles: ScoredFile[];
  forbiddenFiles: ForbiddenFile[];
  authorStats: AuthorStats[];
}

export interface AuthorStats{
  author: string;
  authorEmail: string;
  commitCounts: number;
  files: string[]
}