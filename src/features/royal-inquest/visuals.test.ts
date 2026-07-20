import { describe, expect, it } from 'vitest';

import { royalInquestAssets } from '../../assets/royal-inquest/manifest';
import { blackwoodKeep } from './definition';
import { getCellTileUrl, getCellWalls, getCharacterAvatarUrl } from './visuals';

function cellAt(row: number, column: number) {
  return blackwoodKeep.cells.find(
    (cell) => cell.position.row === row && cell.position.column === column,
  )!;
}

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

  it('uses the same tile for every cell within one chamber', () => {
    const churchCells = blackwoodKeep.cells.filter(({ chamberId }) => chamberId === 'chapel');
    const urls = new Set(churchCells.map((cell) => getCellTileUrl(blackwoodKeep, cell)));
    expect(urls.size).toBe(1);
  });

  it('can pick different variants for different chambers sharing an environment', () => {
    const guardroomCell = blackwoodKeep.cells.find(({ chamberId }) => chamberId === 'guardroom')!;
    const archivesCell = blackwoodKeep.cells.find(({ chamberId }) => chamberId === 'archives')!;
    expect(blackwoodKeep.chamberEnvironments.guardroom).toBe(blackwoodKeep.chamberEnvironments.archives);
    expect(getCellTileUrl(blackwoodKeep, guardroomCell)).not.toBe(
      getCellTileUrl(blackwoodKeep, archivesCell),
    );
  });
});

describe('getCellWalls', () => {
  it('marks a right wall between chambers in the same row', () => {
    expect(getCellWalls(blackwoodKeep, cellAt(0, 1)).right).toBe(true);
  });

  it('marks the second vertical boundary too (previously missing from the hardcoded CSS)', () => {
    expect(getCellWalls(blackwoodKeep, cellAt(0, 3)).right).toBe(true);
  });

  it('does not mark a right wall within the same chamber', () => {
    expect(getCellWalls(blackwoodKeep, cellAt(0, 0)).right).toBe(false);
  });

  it('does not mark a right wall at the board edge', () => {
    expect(getCellWalls(blackwoodKeep, cellAt(0, 5)).right).toBe(false);
  });

  it('marks a bottom wall between chambers in the same column', () => {
    expect(getCellWalls(blackwoodKeep, cellAt(1, 0)).bottom).toBe(true);
  });

  it('does not mark a bottom wall where a chamber spans both rows', () => {
    expect(getCellWalls(blackwoodKeep, cellAt(4, 2)).bottom).toBe(false);
  });

  it('marks a bottom wall at the row 4-5 boundary outside the shared archives span', () => {
    expect(getCellWalls(blackwoodKeep, cellAt(4, 0)).bottom).toBe(true);
  });

  it('does not mark a bottom wall at the board edge', () => {
    expect(getCellWalls(blackwoodKeep, cellAt(5, 0)).bottom).toBe(false);
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

describe('blackwoodKeep chamber names', () => {
  it('gives every cell chamberId a chamberNames entry', () => {
    const chamberIds = new Set(blackwoodKeep.cells.map((cell) => cell.chamberId));
    for (const chamberId of chamberIds) {
      expect(blackwoodKeep.chamberNames[chamberId]).toBeDefined();
    }
  });

  it('gives every chamber a unique display name', () => {
    const chamberIds = new Set(blackwoodKeep.cells.map((cell) => cell.chamberId));
    const names = [...chamberIds].map((chamberId) => blackwoodKeep.chamberNames[chamberId]);
    expect(new Set(names).size).toBe(names.length);
  });
});
