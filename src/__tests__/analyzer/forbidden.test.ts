import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockConfig } from '../fixtures/mockConfig';
import type { ScoredFile } from '../../utils/types';

vi.mock('vscode');
vi.mock('../../config', () => ({
  getConfig: vi.fn(() => mockConfig),
}));

import { detectForbiddenFiles } from '../../analyzer/forbidden';
import { getConfig } from '../../config';

function makeScoredFile(overrides: Partial<ScoredFile> = {}): ScoredFile {
  return {
    path: 'src/test.ts',
    totalCommits: 20,
    uniqueAuthors: ['Alice'],
    lastCommitDate: new Date('2025-01-01'),
    daysSinceLastCommit: 200,
    firstCommitDate: new Date('2024-01-01'),
    ageInDays: 500,
    bugFixCommits: 5,
    bugFixRatio: 0.25,
    dangerScore: 60,
    dangerLevel: 'high',
    scoreBreakdown: { recency: 50, ownership: 100, bugMagnet: 40, churnRate: 10 },
    ...overrides,
  };
}

describe('detectForbiddenFiles', () => {
  beforeEach(() => {
    vi.mocked(getConfig).mockReturnValue(mockConfig);
  });

  it('returns empty array for empty input', () => {
    expect(detectForbiddenFiles([])).toEqual([]);
  });

  it('flags stale file (days >= minDaysSinceTouch)', () => {
    const file = makeScoredFile({ daysSinceLastCommit: 100 });
    const result = detectForbiddenFiles([file]);
    expect(result.length).toBe(1);
    expect(result[0].reasons.some(r => r.includes('Untouched'))).toBe(true);
  });

  it('uses "person has" for single author', () => {
    const file = makeScoredFile({ uniqueAuthors: ['Alice'], totalCommits: 15 });
    const result = detectForbiddenFiles([file]);
    expect(result[0].reasons.some(r => r.includes('person has'))).toBe(true);
  });

  it('flags bug magnet (ratio >= 0.15 AND bugFixCommits >= 3)', () => {
    const file = makeScoredFile({ bugFixRatio: 0.20, bugFixCommits: 5 });
    const result = detectForbiddenFiles([file]);
    expect(result[0].reasons.some(r => r.includes('bug fixes'))).toBe(true);
  });

  it('requires >= 2 reasons to flag', () => {
    const file = makeScoredFile({
      daysSinceLastCommit: 10,
      bugFixRatio: 0,
      bugFixCommits: 0,
      uniqueAuthors: ['Alice', 'Bob', 'Charlie', 'Dave'],
    });
    const result = detectForbiddenFiles([file]);
    expect(result.length).toBe(0);
  });

  it('results sorted by forbiddenScore descending', () => {
    const file1 = makeScoredFile({ path: 'file1.ts', dangerScore: 60 });
    const file2 = makeScoredFile({ path: 'file2.ts', bugFixRatio: 0.5, bugFixCommits: 10, dangerScore: 80 });
    const result = detectForbiddenFiles([file1, file2]);
    expect(result[0].forbiddenScore).toBeGreaterThanOrEqual(result[1].forbiddenScore);
  });
});
