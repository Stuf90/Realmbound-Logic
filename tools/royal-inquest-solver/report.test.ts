import { describe, expect, it } from 'vitest';
import { blackwoodKeep } from '../../src/features/royal-inquest/definition';
import { buildSolveReport } from './report';

describe('buildSolveReport', () => {
  it('passes the bundled Blackwood Keep case with a unique, matching solution', () => {
    const report = buildSolveReport(blackwoodKeep);

    expect(report.issues).toEqual([]);
    expect(report.solutions).toHaveLength(1);
    expect(report.matchesAuthoredSolution).toBe(true);
    expect(report.victimEliminationOk).toBe(true);
  });

  it('surfaces the victim-naming issue and skips solving when a clue names the victim', () => {
    const victimId = blackwoodKeep.characters.find((character) => character.isVictim)!.id;
    const broken = {
      ...blackwoodKeep,
      clues: [
        ...blackwoodKeep.clues,
        { id: 'broken-clue', text: 'invalid', predicate: { type: 'exact-chamber', characterId: victimId, chamberId: 'solar' } },
      ],
    };

    const report = buildSolveReport(broken as typeof blackwoodKeep);

    expect(report.issues).toContain(
      `Clue "broken-clue" names the victim directly; the victim's position must be derived only from other witnesses.`,
    );
    expect(report.solutions).toEqual([]);
    expect(report.matchesAuthoredSolution).toBeNull();
    expect(report.victimEliminationOk).toBeNull();
  });
});
