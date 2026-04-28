import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockConfig } from '../fixtures/mockConfig';
import {
  safeFile,
  criticalFile,
  mediumFile,
  excludedFile,
  highChurnFile,
  zeroAgeFile,
  allFiles,
} from '../fixtures/mockFileMetrics';

// Mock vscode + config before importing scorer
vi.mock('vscode');
vi.mock('../../config', () => ({
  getConfig: vi.fn(() => mockConfig),
}));

import { scoreFiles } from '../../analyzer/scorer';
import { getConfig } from '../../config';

describe('scorer', () => {
  beforeEach(() => {
    vi.mocked(getConfig).mockReturnValue(mockConfig);
  });

  it('returns empty array for empty input', () => {
    expect(scoreFiles([])).toEqual([]);
  });

  it('returns one ScoredFile per input FileMetrics', () => {
    const result = scoreFiles(allFiles);
    expect(result).toHaveLength(allFiles.length);
  });

  it('each result contains scoreBreakdown with all four components', () => {
    const [first] = scoreFiles([safeFile]);
    expect(first.scoreBreakdown).toHaveProperty('recency');
    expect(first.scoreBreakdown).toHaveProperty('ownership');
    expect(first.scoreBreakdown).toHaveProperty('bugMagnet');
    expect(first.scoreBreakdown).toHaveProperty('churnRate');
  });

  it('each result has dangerScore and dangerLevel', () => {
    const [first] = scoreFiles([safeFile]);
    expect(typeof first.dangerScore).toBe('number');
    expect(['critical', 'high', 'medium', 'low', 'safe']).toContain(first.dangerLevel);
  });

  it('recency: 0 days since last commit → recency = 0', () => {
    const [result] = scoreFiles([zeroAgeFile]);
    expect(result.scoreBreakdown.recency).toBe(0);
  });

  it('recency: 365 days → recency = 100', () => {
    const file = { ...safeFile, daysSinceLastCommit: 365 };
    const [result] = scoreFiles([file]);
    expect(result.scoreBreakdown.recency).toBe(100);
  });

  it('recency: very large value → still capped at 100', () => {
    const file = { ...safeFile, daysSinceLastCommit: 5000 };
    const [result] = scoreFiles([file]);
    expect(result.scoreBreakdown.recency).toBe(100);
  });

  it('ownership: 1 author → 100', () => {
    const [result] = scoreFiles([criticalFile]);
    expect(result.scoreBreakdown.ownership).toBe(100);
  });

  it('ownership: 10+ authors → 0', () => {
    const [result] = scoreFiles([safeFile]);
    expect(result.scoreBreakdown.ownership).toBe(0);
  });

  it('bugMagnet: ratio=0, count=0 → 0', () => {
    const [result] = scoreFiles([safeFile]);
    expect(result.scoreBreakdown.bugMagnet).toBe(0);
  });

  it('churnRate: ageInDays=0 → 0 (no division by zero)', () => {
    const [result] = scoreFiles([zeroAgeFile]);
    expect(result.scoreBreakdown.churnRate).toBe(0);
  });

  it('excluded file: package.json → dangerScore forced to 10', () => {
    const [result] = scoreFiles([excludedFile]);
    expect(result.dangerScore).toBe(10);
  });

  it('custom weights via config override change the score', () => {
    const customConfig = {
      ...mockConfig,
      dangerScoreWeights: { recency: 1, ownership: 0, bugMagnet: 0, churnRate: 0 },
    };
    vi.mocked(getConfig).mockReturnValue(customConfig);

    const [result] = scoreFiles([criticalFile]);
    expect(result.dangerScore).toBe(result.scoreBreakdown.recency);
  });
});
