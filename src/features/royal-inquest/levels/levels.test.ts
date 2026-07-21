import { describe, expect, it } from 'vitest';
import { validateInquestDefinition } from '../definitionValidation';
import { thornfieldManor } from './thornfieldManor';
import { ravensholtAbbey } from './ravensholtAbbey';
import { royalInquestLevels, getRoyalInquestLevel } from './index';

describe.each([
  ['Thornfield Manor', thornfieldManor],
  ['Ravensholt Abbey', ravensholtAbbey],
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
});

describe('royalInquestLevels registry', () => {
  it('lists Blackwood Keep, Thornfield Manor, and Ravensholt Abbey in order', () => {
    expect(royalInquestLevels.map((level) => level.id)).toEqual([
      'blackwood-keep',
      'thornfield-manor',
      'ravensholt-abbey',
    ]);
  });

  it('looks up a level by id', () => {
    expect(getRoyalInquestLevel('thornfield-manor')).toBe(thornfieldManor);
  });

  it('throws for an unknown id', () => {
    expect(() => getRoyalInquestLevel('nonexistent')).toThrow('Unknown Royal Inquest level');
  });
});
