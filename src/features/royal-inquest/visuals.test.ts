import { describe, expect, it } from 'vitest';

import { royalInquestAssets } from '../../assets/royal-inquest/manifest';
import { blackwoodKeep } from './definition';
import { getCellTileUrl, getCharacterAvatarUrl } from './visuals';

describe('getCharacterAvatarUrl', () => {
  it('resolves a character to its manifest avatar image', () => {
    const envoy = blackwoodKeep.characters.find(({ id }) => id === 'envoy')!;
    expect(getCharacterAvatarUrl(envoy)).toBe(royalInquestAssets.avatars['royal-envoy']);
  });
});

describe('getCellTileUrl', () => {
  it('resolves a cell to a variant of its chamber environment', () => {
    const cell = blackwoodKeep.cells.find(({ chamberId }) => chamberId === 'chapel')!;
    expect(royalInquestAssets.tiles.church).toContain(getCellTileUrl(blackwoodKeep, cell));
  });

  it('varies the tile across both rows and columns for a multi-variant environment', () => {
    const churchCells = blackwoodKeep.cells.filter(({ chamberId }) => chamberId === 'chapel');
    const urls = new Set(churchCells.map((cell) => getCellTileUrl(blackwoodKeep, cell)));
    expect(urls.size).toBeGreaterThan(1);
  });
});

describe('blackwoodKeep asset wiring', () => {
  it('gives every character an avatarId that resolves to a real manifest entry', () => {
    for (const character of blackwoodKeep.characters) {
      expect(royalInquestAssets.avatars[character.avatarId]).toBeDefined();
    }
  });

  it('gives every cell chamberId a chamberEnvironments entry that resolves to a real tile set', () => {
    const chamberIds = new Set(blackwoodKeep.cells.map((cell) => cell.chamberId));
    for (const chamberId of chamberIds) {
      const environment = blackwoodKeep.chamberEnvironments[chamberId];
      expect(environment).toBeDefined();
      expect(royalInquestAssets.tiles[environment]).toBeDefined();
    }
  });
});
