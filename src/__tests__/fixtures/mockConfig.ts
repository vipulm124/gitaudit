import type { GitAuditConfig } from '../../config';

export const mockConfig: GitAuditConfig = {
  minDaysSinceTouch: 60,
  maxAuthors: 3,
  minCommits: 10,
  minBugFixRatio: 0.15,
  minDangerScore: 40,
  dangerScoreWeights: {
    recency: 0.30,
    ownership: 0.25,
    bugMagnet: 0.30,
    churnRate: 0.15,
  },
  cacheTTLHours: 24,
  bugFixKeywords: ['bug', 'fix', 'patch', 'hotfix', 'crash', 'error'],
  refactorKeywords: ['refactor', 'cleanup', 'clean up', 'restructure'],
  featureKeywords: ['feature', 'feat', 'add', 'new', 'implement', 'support'],
  exceptionFiles: ['Dockerfile', 'package.json', 'package-lock.json'],
};
