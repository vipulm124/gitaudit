import { describe, it, expect } from 'vitest';
import { CACHE_VERSION } from '../../utils/constants';

describe('constants', () => {
  it('CACHE_VERSION is "1.0.0"', () => {
    expect(CACHE_VERSION).toBe('1.0.0');
  });
});
