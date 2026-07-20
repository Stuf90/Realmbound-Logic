import { describe, expect, it } from 'vitest'; import { blackwoodKeep } from './definition'; import { getInquestHint } from './hints'; import { createInitialInquestState } from './reducer';
describe('inquest hints',()=>{it('offers the first deterministic deduction',()=>{expect(getInquestHint(blackwoodKeep,createInitialInquestState())).toMatchObject({characterId:'aldric',position:{row:1,column:0}});});
it('surfaces clue text for a pairwise-predicate clue, not just characterId-shaped ones',()=>{
const definition={...blackwoodKeep,clues:[{id:'test-pairwise',text:'Beatrice was tied to Aldric alone.',predicate:{type:'same-chamber' as const,firstCharacterId:'aldric',secondCharacterId:'beatrice'}}]};
const state={...createInitialInquestState(),placements:{envoy:{row:0,column:1},aldric:{row:1,column:0},cedric:{row:4,column:3},daria:{row:5,column:5},edmund:{row:3,column:4}}};
const hint=getInquestHint(definition,state);
expect(hint).toMatchObject({characterId:'beatrice',position:{row:2,column:2}});
expect(hint?.message).toContain('Beatrice was tied to Aldric alone.');
});});
