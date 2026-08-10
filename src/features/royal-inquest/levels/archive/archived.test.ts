import { describe, expect, it } from 'vitest';
import { validateInquestDefinition } from '../../definitionValidation';
import { blackwoodKeep } from './blackwoodKeep';
import { thornfieldManor } from './thornfieldManor';
import { ravensholtAbbey } from './ravensholtAbbey';
import { marrowfenChapel } from './marrowfenChapel';
import { ashwellManor } from './ashwellManor';
import { thistledownMarket } from './thistledownMarket';
import { wrenmoorWatchtower } from './wrenmoorWatchtower';
import { hollowmereLodge } from './hollowmereLodge';

// These 8 cases were retired from the active `royalInquestLevels` rotation (see ../index.ts) but
// are kept here, still regression-tested, for provenance.
describe.each([
  ['Blackwood Keep', blackwoodKeep],
  ['Thornfield Manor', thornfieldManor],
  ['Ravensholt Abbey', ravensholtAbbey],
  ['Marrowfen Chapel', marrowfenChapel],
  ['Ashwell Manor', ashwellManor],
  ['Thistledown Market', thistledownMarket],
  ['Wrenmoor Watchtower', wrenmoorWatchtower],
  ['Hollowmere Lodge', hollowmereLodge],
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
