import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockConfig } from '../fixtures/mockConfig';

vi.mock('../../config', () => ({
  getConfig: vi.fn(() => mockConfig),
}));

import { createAuthorChart } from '../../analyzer/authorchart';
import { execSync } from 'child_process';

const mockedExec = vi.mocked(execSync);

describe('authorchart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates author statistics from git log', () => {
    const S = String.fromCharCode(31);
    const mockOutput = `${S}AUTHOR${S}Alice${S}alice@example.com\nfile1.ts\n${S}AUTHOR${S}Alice${S}alice@example.com\nfile2.ts\n${S}AUTHOR${S}Bob${S}bob@example.com\nfile1.ts`;
    mockedExec.mockReturnValue(mockOutput);

    const result = createAuthorChart('/mock/repo');
    
    expect(result.length).toBeGreaterThan(0);
    
    const alice = result.find(a => a.author === 'Alice');
    expect(alice).toBeDefined();
    expect(alice?.commitCounts).toBe(2);
    expect(result.find(a => a.author === 'Bob')?.commitCounts).toBe(1);
  });
});
