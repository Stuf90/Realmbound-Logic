import { describe, expect, it } from 'vitest';

import { royalInquestAssets } from './manifest';

describe('royalInquestAssets', () => {
  it('exports the complete unique runtime asset pack', () => {
    expect(Object.keys(royalInquestAssets.avatars)).toHaveLength(18);
    // 25, not 24: 'window' is a TODO(art) placeholder that intentionally reuses the
    // stone-planter image until real window art is sourced — see the manifest comment.
    expect(Object.keys(royalInquestAssets.props)).toHaveLength(25);
    expect(Object.keys(royalInquestAssets.tiles)).toHaveLength(7);

    const tileVariantCounts = Object.values(royalInquestAssets.tiles).map((variants) => variants.length);
    expect(tileVariantCounts.sort((a, b) => b - a)).toEqual([3, 3, 3, 3, 1, 1, 1]);

    const urls = [
      ...Object.values(royalInquestAssets.avatars),
      ...Object.values(royalInquestAssets.props),
      ...Object.values(royalInquestAssets.tiles).flat(),
    ];
    expect(urls).toHaveLength(58);
    // 57, not 58: 'window' deliberately shares its URL with 'stone-planter' (placeholder art).
    expect(new Set(urls).size).toBe(57);
  });
});
