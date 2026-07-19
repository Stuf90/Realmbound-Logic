import { useState } from 'react';
import { RoyalInquest } from '../features/royal-inquest/RoyalInquest';
import { SiegeLines } from '../features/siege-lines/SiegeLines';
import { loadPuzzle } from '../shared/persistence';
import { getPuzzleFamily, PUZZLE_FAMILIES, type PuzzleFamily, type PuzzleFamilyId } from './puzzleCatalog';
import './app.css';

type View =
  | { kind: 'ledger' }
  | { kind: 'levels'; familyId: PuzzleFamilyId }
  | { kind: 'briefing'; familyId: PuzzleFamilyId }
  | { kind: 'puzzle'; familyId: PuzzleFamilyId };

const LEVEL_COUNT = 40;

export function App() {
  const [view, setView] = useState<View>({ kind: 'ledger' });

  if (view.kind === 'ledger') {
    return <PuzzleLedger onSelect={(familyId) => setView({ kind: 'levels', familyId })} />;
  }

  const family = getPuzzleFamily(view.familyId);
  const showLevels = () => setView({ kind: 'levels', familyId: family.id });

  if (view.kind === 'levels') {
    return (
      <LevelSelection
        family={family}
        onBack={() => setView({ kind: 'ledger' })}
        onSelect={() => setView({ kind: 'briefing', familyId: family.id })}
      />
    );
  }

  if (view.kind === 'briefing') {
    return <Briefing family={family} onBack={showLevels} onBegin={() => setView({ kind: 'puzzle', familyId: family.id })} />;
  }

  if (family.id === 'royal-inquest') return <RoyalInquest onBack={showLevels} />;
  if (family.id === 'siege-lines') return <SiegeLines onBack={showLevels} />;
  return null;
}

function PuzzleLedger({ onSelect }: { onSelect: (familyId: PuzzleFamilyId) => void }) {
  return (
    <main className="ledger">
      <header>
        <p className="eyebrow">His Majesty’s Office of Reason</p>
        <h1>The King’s Ledger</h1>
        <p>Choose a discipline, then select a commission from its record.</p>
      </header>
      <section className="commission-grid" aria-label="Puzzle families">
        {PUZZLE_FAMILIES.map((family, index) => (
          <article className={`commission-card ${family.accent}${family.available ? '' : ' unavailable'}`} key={family.id}>
            <span className="card-mark" aria-hidden="true">{toRoman(index + 1)}</span>
            <p className="eyebrow">{family.discipline}</p>
            <h2>{family.name}</h2>
            <p>{family.description}</p>
            <button
              className="primary"
              disabled={!family.available}
              onClick={() => onSelect(family.id)}
              aria-label={`Select ${family.name}${family.available ? '' : ', coming later'}`}
            >
              {family.available ? 'Choose puzzle' : 'Coming later'}
            </button>
          </article>
        ))}
      </section>
      <footer>Progress is kept automatically in this browser.</footer>
    </main>
  );
}

function LevelSelection({ family, onBack, onSelect }: { family: PuzzleFamily; onBack: () => void; onSelect: () => void }) {
  const completed = family.levelOne
    ? loadPuzzle<unknown>(family.levelOne.puzzleId)?.completed === true
    : false;

  return (
    <main className="level-page">
      <button className="text-button" onClick={onBack} aria-label="Back to puzzle families">← Back to puzzle families</button>
      <header className="level-header">
        <p className="eyebrow">{family.discipline} · Commission archive</p>
        <h1>{family.name}</h1>
        <p>Select a level. Further commissions will be unsealed as they are prepared.</p>
      </header>
      <ol className="level-grid" aria-label={`${family.name} levels`}>
        {Array.from({ length: LEVEL_COUNT }, (_, index) => {
          const level = index + 1;
          const available = level === 1 && Boolean(family.levelOne);
          return (
            <li key={level}>
              <button
                className="level-card"
                disabled={!available}
                onClick={available ? onSelect : undefined}
                aria-label={available ? `Level ${level}: ${family.levelOne?.title}` : `Level ${level}: sealed`}
              >
                <span className="level-number">Level {level}</span>
                {available ? <span className="level-title">{family.levelOne?.title}</span> : <span className="level-locked">Sealed</span>}
                {available && completed ? (
                  <span className="completion-mark" role="status" aria-label="Completed">
                    <span aria-hidden="true">✓</span> Completed
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

function Briefing({ family, onBack, onBegin }: { family: PuzzleFamily; onBack: () => void; onBegin: () => void }) {
  const inquest = family.id === 'royal-inquest';
  return (
    <main className="briefing">
      <button className="text-button" onClick={onBack} aria-label={`Back to ${family.name} levels`}>← Back to {family.name} levels</button>
      <div className="briefing-sheet">
        <p className="eyebrow">By order of the Crown</p>
        <h1>{family.levelOne?.title}</h1>
        <p className="dropcap">
          {inquest
            ? 'A royal envoy lies slain inside Blackwood Keep. Six witnesses occupied six distinct rows and columns. Arrange them from their testimony, then identify the sole lord who shared the envoy’s chamber.'
            : 'The northern road has collapsed beneath a siege train. Rebuild one continuous passage between the two gates while satisfying the masons’ count for every line.'}
        </p>
        <h2>Your charge</h2>
        <ul>
          {inquest ? (
            <>
              <li>Place one character in every row and column.</li>
              <li>Respect blocked scenery, chamber boundaries, and witness clues.</li>
              <li>Use ink crosses to mark impossible cells.</li>
            </>
          ) : (
            <>
              <li>Lay straight and curved road segments.</li>
              <li>Match every connection and numbered line count.</li>
              <li>Prevent branches, loops, and isolated road.</li>
            </>
          )}
        </ul>
        <button className="primary" onClick={onBegin}>{inquest ? 'Begin the inquest' : 'Open the works'}</button>
      </div>
    </main>
  );
}

function toRoman(value: number): string {
  return ['I', 'II', 'III', 'IV', 'V'][value - 1] ?? String(value);
}
