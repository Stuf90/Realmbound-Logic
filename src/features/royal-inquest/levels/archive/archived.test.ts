import { describe, expect, it } from 'vitest';
import { validateInquestDefinition } from '../../definitionValidation';
import { blackwoodKeep } from './blackwoodKeep';
import { thornfieldManor } from './thornfieldManor';
import { ravensholtAbbey } from './ravensholtAbbey';

// These 3 cases were retired from the active `royalInquestLevels` rotation (see ../index.ts) but
// are kept here, still regression-tested, for provenance.
describe.each([
  ['Blackwood Keep', blackwoodKeep],
  ['Thornfield Manor', thornfieldManor],
  ['Ravensholt Abbey', ravensholtAbbey],
])('%s definition (archived)', (_name, definition) => {
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
