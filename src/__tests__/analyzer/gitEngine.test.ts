import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockConfig } from '../fixtures/mockConfig';

vi.mock('../../config', () => ({
  getConfig: vi.fn(() => mockConfig),
}));

import { analyzeRepo } from '../../analyzer/gitEngine';
import { execSync } from 'child_process';

const mockedExec = vi.mocked(execSync);

describe('gitEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses git log output correctly', async () => {
    const sep = '\x1f';
    const mockOutput = `${sep}COMMIT${sep}H1${sep}Alice${sep}alice@ex.com${sep}2024-01-01${sep}fix bug\nfile.ts\n${sep}COMMIT${sep}H2${sep}Bob${sep}bob@ex.com${sep}2024-01-02${sep}add feat\nfile.ts`;
    
    // Reverse order for mockReturnValueOnce
    mockedExec.mockReturnValueOnce('true'); // isGitRepo
    mockedExec.mockReturnValueOnce('2');    // totalCommits
    mockedExec.mockReturnValue(mockOutput); // actual log

    const result = await analyzeRepo('/mock/repo');
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe('file.ts');
  });

  it('handles empty log output', async () => {
    mockedExec.mockReturnValueOnce('true');
    mockedExec.mockReturnValueOnce('0');
    mockedExec.mockReturnValue('');
    
    const result = await analyzeRepo('/mock/repo');
    expect(result.files).toHaveLength(0);
  });
});
