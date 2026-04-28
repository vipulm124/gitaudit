import { describe, it, expect, vi } from 'vitest';



import { getConfig } from '../config';

describe('config', () => {
  it('returns an object with expected keys', () => {
    const config = getConfig();
    expect(config).toHaveProperty('minDaysSinceTouch');
    expect(config.minDaysSinceTouch).toBe(60);
  });
});
