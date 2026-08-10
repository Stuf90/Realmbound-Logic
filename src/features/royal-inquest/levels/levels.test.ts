import { describe, expect, it } from 'vitest';
import { validateInquestDefinition } from '../definitionValidation';
import { graywickPriory } from './graywickPriory';
import { fenmoorAlmshouse } from './fenmoorAlmshouse';
import { duskhollowGranary } from './duskhollowGranary';
import { sableridgeGarrison } from './sableridgeGarrison';
import { wyrmscarInfirmary } from './wyrmscarInfirmary';
import { royalInquestLevels, getRoyalInquestLevel } from './index';

describe.each([
  ['Graywick Priory', graywickPriory],
  ['Fenmoor Almshouse', fenmoorAlmshouse],
  ['Duskhollow Granary', duskhollowGranary],
  ['Sableridge Garrison', sableridgeGarrison],
  ['Wyrmscar Infirmary', wyrmscarInfirmary],
])('%s definition', (_name, definition) => {
  it('is a structurally valid inquest with a unique, clue-derivable solution', () => {
    expect(validateInquestDefinition(definition)).toEqual([]);
  });

  it('contains six characters, thirty-six cells, and exactly one victim', () => {
    expect(definition.cells).toHaveLength(36);
    expect(definition.characters).toHaveLength(6);
    expect(definition.characters.filter(({ isVictim }) => isVictim)).toHaveLength(1);
  });

  it('names a traitor distinct from the victim', () => {
    const victim = definition.characters.find(({ isVictim }) => isVictim);
    expect(definition.traitorId).not.toBe(victim?.id);
  });

  it('declares difficulty 1', () => {
    expect(definition.difficulty).toBe(1);
  });
});

describe('royalInquestLevels registry', () => {
  it('lists the 5 difficulty-1 cases in order', () => {
    expect(royalInquestLevels.map((level) => level.id)).toEqual([
      'graywick-priory',
      'fenmoor-almshouse',
      'duskhollow-granary',
      'sableridge-garrison',
      'wyrmscar-infirmary',
    ]);
  });

  it('looks up a level by id', () => {
    expect(getRoyalInquestLevel('graywick-priory')).toBe(graywickPriory);
  });

  it('throws for an unknown id', () => {
    expect(() => getRoyalInquestLevel('nonexistent')).toThrow('Unknown Royal Inquest level');
  });
});
