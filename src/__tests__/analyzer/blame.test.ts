import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockConfig } from '../fixtures/mockConfig';

vi.mock('../../config', () => ({
  getConfig: vi.fn(() => mockConfig),
}));

import { getFileBlame } from '../../analyzer/blame';
import { execSync } from 'child_process';

const mockedExec = vi.mocked(execSync);

describe('blame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses git blame output correctly', () => {
    const sep = '\x1f';
    const mockOutput = `${sep}COMMIT${sep}H1${sep}Alice${sep}alice@ex.com${sep}2024-01-01${sep}my commit\nfile.ts`;
    mockedExec.mockReturnValue(mockOutput);

    const result = getFileBlame('/mock/repo', 'file.ts');
    expect(result.authorContributions).toHaveLength(1);
    expect(result.authorContributions[0].author).toBe('Alice');
  });

  it('handles empty log output', () => {
    mockedExec.mockReturnValue('');
    const result = getFileBlame('/mock/repo', 'file.ts');
    expect(result.authorContributions).toHaveLength(0);
  });
});
