import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockConfig } from '../fixtures/mockConfig';

vi.mock('vscode');
vi.mock('../../config', () => ({
  getConfig: vi.fn(() => mockConfig),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import * as fs from 'fs';
import { saveCache, loadCache } from '../../cache/cache';
import { CACHE_VERSION } from '../../utils/constants';

const mockedFs = vi.mocked(fs);

describe('cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes valid JSON to cache file', () => {
    mockedFs.existsSync.mockReturnValue(true);
    saveCache('/mock/repo', 'main', {} as any, [], [], []);
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
  });

  it('returns null when cache version mismatches', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ version: '0.0.0', analyzedAt: new Date().toISOString() }));
    expect(loadCache('/mock/repo')).toBeNull();
  });
});
