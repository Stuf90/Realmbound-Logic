import { describe, expect, it } from 'vitest';

import { royalInquestAssets } from './manifest';

describe('royalInquestAssets', () => {
  it('exports the complete unique runtime asset pack', () => {
    expect(Object.keys(royalInquestAssets.avatars)).toHaveLength(18);
    expect(Object.keys(royalInquestAssets.props)).toHaveLength(22);
    expect(Object.keys(royalInquestAssets.tiles)).toHaveLength(7);

    const tileVariantCounts = Object.values(royalInquestAssets.tiles).map((variants) => variants.length);
    expect(tileVariantCounts.sort((a, b) => b - a)).toEqual([3, 3, 3, 3, 1, 1, 1]);

    const urls = [
      ...Object.values(royalInquestAssets.avatars),
      ...Object.values(royalInquestAssets.props),
      ...Object.values(royalInquestAssets.tiles).flat(),
    ];
    expect(urls).toHaveLength(55);
    expect(new Set(urls).size).toBe(55);
  });
});
