import { describe, expect, it } from 'vitest';
import { propCategoryByAsset, propKindByAsset, propsByEnvironment, royalInquestAssets } from './manifest';

describe('Royal Inquest asset manifest', () => {
  it('registers the complete pack with only the documented window placeholder', () => {
    const { avatars, props, tiles, marks } = royalInquestAssets;
    expect(Object.keys(avatars)).toHaveLength(18);
    expect(Object.keys(props)).toHaveLength(40);
    expect(Object.keys(tiles)).toHaveLength(10);
    expect(Object.values(tiles).flat()).toHaveLength(24);
    expect(Object.keys(marks).sort()).toEqual(['autoCross', 'manualCross']);
    const urls = [...Object.values(avatars), ...Object.values(props), ...Object.values(tiles).flat(), ...Object.values(marks)];
    expect(urls).toHaveLength(84);
    expect(new Set(urls).size).toBe(83);
    expect(props.window).toBe(props['stone-planter']);
    expect(Object.keys(propKindByAsset).sort()).toEqual(Object.keys(props).sort());
    expect(Object.keys(propCategoryByAsset).sort()).toEqual(Object.keys(props).sort());
  });

  it('registers three tiles and the intended prop kinds for each rural environment', () => {
    for (const environment of ['farm', 'tavern', 'cabin'] as const) {
      expect(royalInquestAssets.tiles[environment]).toHaveLength(3);
      expect(propsByEnvironment[environment]).toContain('window');
      for (const id of propsByEnvironment[environment]) expect(royalInquestAssets.props[id]).toBeTruthy();
    }
    expect(propsByEnvironment.farm).toEqual(['hay-bale', 'feed-trough', 'well', 'scarecrow', 'farm-fence', 'window']);
    expect(propsByEnvironment.tavern).toEqual(['tavern-bar', 'barstool', 'ale-barrel', 'fireplace', 'dartboard', 'barrel-cluster', 'window']);
    expect(propsByEnvironment.cabin).toEqual(['cabin-bed', 'wood-stove', 'washbasin', 'rocking-chair', 'chest', 'window']);
    const seats = ['tavern-bar', 'barstool', 'cabin-bed', 'rocking-chair'];
    const rural = [...propsByEnvironment.farm, ...propsByEnvironment.tavern, ...propsByEnvironment.cabin];
    for (const id of rural) expect(propKindByAsset[id]).toBe(seats.includes(id) ? 'seat' : 'decorative');
  });
});
