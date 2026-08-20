import { describe, expect, it } from 'vitest';
import { propKindByAsset } from '../../assets/royal-inquest/manifest';
import { resolveClueText } from './skin';
import { royalInquestLevels } from './levels';
import { definition as easy13Definition, skin as easy13Skin } from './levels/easy-13';

describe('resolveClueText', () => {
  it('substitutes suspect, room, and prop ids with their skin display names', () => {
    const clue = easy13Definition.clues.find((candidate) => candidate.id === 'clue-2')!;
    expect(clue.text).toBe('B is beside asset-2-1');
    const resolved = resolveClueText(clue, easy13Skin, easy13Definition);
    expect(resolved).toBe('Sir Boren is beside Barrel Cluster');
  });

  it('strips the "(supplemental) " authoring prefix', () => {
    const clue = easy13Definition.clues.find((candidate) => candidate.id === 'clue-6')!;
    expect(clue.text).toBe('(supplemental) A is in column 0');
    const resolved = resolveClueText(clue, easy13Skin, easy13Definition);
    expect(resolved.startsWith('(supplemental)')).toBe(false);
    expect(resolved).toBe('Lady Annora is in column 0');
  });

  it('does not let a shorter overlapping id clobber a longer asterisked id', () => {
    const clue = easy13Definition.clues.find((candidate) => candidate.id === 'clue-4')!;
    expect(clue.text).toBe('E is on asset-4*-2');
    const resolved = resolveClueText(clue, easy13Skin, easy13Definition);
    expect(resolved).toBe('Handmaiden Evaine is on Simple Chair');
  });
});

describe('level skins', () => {
  for (const level of royalInquestLevels) {
    describe(level.id, () => {
      it('has a skin entry for every suspect, room, and prop', () => {
        for (const suspect of level.definition.suspects) {
          expect(level.skin.suspects[suspect.id], `missing suspect skin for ${suspect.id}`).toBeDefined();
        }
        for (const room of level.definition.rooms) {
          expect(level.skin.rooms[room.id], `missing room skin for ${room.id}`).toBeDefined();
        }
        for (const prop of level.definition.props) {
          expect(level.skin.props[prop.id], `missing prop skin for ${prop.id}`).toBeDefined();
        }
      });

      it("matches each prop's chosen asset kind to the placeholder prop's kind", () => {
        for (const prop of level.definition.props) {
          const assetId = level.skin.props[prop.id]!.assetId;
          expect(propKindByAsset[assetId], `unknown asset kind for ${assetId}`).toBe(prop.kind);
        }
      });
    });
  }
});
