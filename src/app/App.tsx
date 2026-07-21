import { useState } from 'react';
import { RoyalInquest } from '../features/royal-inquest/RoyalInquest';
import { getRoyalInquestLevel } from '../features/royal-inquest/levels';
import { SiegeLines } from '../features/siege-lines/SiegeLines';
import { deletePuzzle, loadPuzzle, type PuzzleSave } from '../shared/persistence';
import { getPuzzleFamily, PUZZLE_FAMILIES, type PuzzleFamily, type PuzzleFamilyId } from './puzzleCatalog';
import './app.css';

type View =
  | { kind: 'ledger' }
  | { kind: 'levels'; familyId: PuzzleFamilyId }
  | { kind: 'briefing' | 'puzzle'; familyId: PuzzleFamilyId; levelIndex: number };
const LEVEL_COUNT = 40;

export function App() {
  const [view, setView] = useState<View>({ kind: 'ledger' });
  if (view.kind === 'ledger') return <PuzzleLedger onSelect={(familyId) => setView({ kind: 'levels', familyId })} />;
  const family = getPuzzleFamily(view.familyId);
  const showLevels = () => setView({ kind: 'levels', familyId: family.id });
  if (view.kind === 'levels') return <LevelSelection family={family} onBack={() => setView({ kind: 'ledger' })} onBriefing={(levelIndex) => setView({ kind: 'briefing', familyId: family.id, levelIndex })} onPlay={(levelIndex) => setView({ kind: 'puzzle', familyId: family.id, levelIndex })} />;
  const level = family.levels[view.levelIndex - 1];
  if (!level) return null;
  if (view.kind === 'briefing') return <Briefing family={family} level={level} onBack={showLevels} onBegin={() => setView({ kind: 'puzzle', familyId: family.id, levelIndex: view.levelIndex })} />;
  if (family.id === 'royal-inquest') return <RoyalInquest definition={getRoyalInquestLevel(level.puzzleId)} onBack={showLevels} />;
  if (family.id === 'siege-lines') return <SiegeLines onBack={showLevels} />;
  return null;
}

function PuzzleLedger({ onSelect }: { onSelect: (familyId: PuzzleFamilyId) => void }) {
  return <main className="app-shell ledger">
    <header className="ledger-header"><p className="eyebrow">His Majesty’s Office of Reason</p><h1>The King’s Ledger</h1><p>Choose a discipline, then select a commission from its record.</p></header>
    <section className="commission-list app-workspace" role="region" aria-label="Puzzle families">
      {PUZZLE_FAMILIES.map((family, index) => <button className={`commission-row ${family.accent}`} disabled={!family.available} onClick={() => onSelect(family.id)} aria-label={`${family.name}. ${family.discipline}. ${family.description}`} key={family.id}>
        <span className="card-mark" aria-hidden="true">{['I', 'II', 'III', 'IV', 'V'][index]}</span>
        <span className="commission-copy"><span className="eyebrow">{family.discipline}</span><strong>{family.name}</strong><span className="commission-description">{family.description}</span></span>
      </button>)}
    </section>
    <footer className="ledger-footer">Progress is kept automatically in this browser.</footer>
  </main>;
}

function LevelSelection({ family, onBack, onBriefing, onPlay }: { family: PuzzleFamily; onBack: () => void; onBriefing: (levelIndex: number) => void; onPlay: (levelIndex: number) => void }) {
  const [pendingReplay, setPendingReplay] = useState<{ levelIndex: number; save: PuzzleSave<unknown> } | null>(null);
  const selectLevel = (levelIndex: number, puzzleId: string) => {
    const save = loadPuzzle<unknown>(puzzleId);
    if (save?.completed) setPendingReplay({ levelIndex, save });
    else onBriefing(levelIndex);
  };
  const resetAndReplay = () => {
    if (!pendingReplay) return;
    const puzzleId = family.levels[pendingReplay.levelIndex - 1]?.puzzleId;
    if (!puzzleId) return;
    deletePuzzle(puzzleId);
    const levelIndex = pendingReplay.levelIndex;
    setPendingReplay(null);
    onPlay(levelIndex);
  };
  return <main className="app-shell level-page"><header className="app-topbar"><button className="text-button" onClick={onBack} aria-label="Back to puzzle families">← Puzzle families</button></header><section className="level-workspace app-workspace"><header className="level-header"><p className="eyebrow">{family.discipline} · Commission archive</p><h1>{family.name}</h1><p>Select a level. Further commissions will be unsealed as they are prepared.</p></header><ol className="level-grid internal-scroll" aria-label={`${family.name} levels`}>{Array.from({ length: LEVEL_COUNT }, (_, index) => { const levelIndex = index + 1; const entry = family.levels[index]; const available = Boolean(entry); const save = entry ? loadPuzzle<unknown>(entry.puzzleId) : null; const completed = save?.completed === true; return <li key={levelIndex}><button className="level-card" disabled={!available} onClick={entry ? () => selectLevel(levelIndex, entry.puzzleId) : undefined} aria-label={entry ? `Level ${levelIndex}: ${entry.title}` : `Level ${levelIndex}: sealed`}><span className="level-number">Level {levelIndex}</span>{entry ? <span className="level-title">{entry.title}</span> : <span className="level-locked">Sealed</span>}{completed ? <span className="completion-mark" role="status" aria-label="Completed"><span aria-hidden="true">✓</span> Completed</span> : null}</button></li>; })}</ol></section>{pendingReplay ? <div className="replay-backdrop"><section className="replay-dialog" role="dialog" aria-modal="true" aria-labelledby="replay-dialog-title"><p className="eyebrow">Completed commission</p><h2 id="replay-dialog-title">Replay completed puzzle?</h2><p>{family.levels[pendingReplay.levelIndex - 1]?.title}</p><p className="completion-time">Completed in {formatElapsedTime(pendingReplay.save.elapsedSeconds)}</p><p>Resetting removes the saved solution and starts a fresh attempt immediately.</p><div className="replay-actions"><button autoFocus onClick={() => setPendingReplay(null)}>Cancel</button><button className="primary" onClick={resetAndReplay}>Reset and replay</button></div></section></div> : null}</main>;
}

function Briefing({ family, level, onBack, onBegin }: { family: PuzzleFamily; level: { title: string; puzzleId: string }; onBack: () => void; onBegin: () => void }) {
  const inquest = family.id === 'royal-inquest';
  return <main className="app-shell briefing"><header className="app-topbar"><button className="text-button" onClick={onBack} aria-label={`Back to ${family.name} levels`}>← {family.name} levels</button></header><section className="briefing-sheet app-workspace"><div className="briefing-scroll internal-scroll" role="region" aria-label="Commission briefing"><p className="eyebrow">By order of the Crown</p><h1>{level.title}</h1><p className="dropcap">{inquest ? 'A body has been found within the walls. Six witnesses occupied six distinct rows and columns. Arrange them from their testimony, then identify the sole soul who shared the victim’s chamber.' : 'The northern road has collapsed beneath a siege train. Rebuild one continuous passage between the two gates while satisfying the masons’ count for every line.'}</p><h2>Your charge</h2><ul>{inquest ? <><li>Place one character in every row and column.</li><li>Respect blocked scenery, chamber boundaries, and witness clues.</li><li>Use ink crosses to mark impossible cells.</li></> : <><li>Lay straight and curved road segments.</li><li>Match every connection and numbered line count.</li><li>Prevent branches, loops, and isolated road.</li></>}</ul></div><footer className="briefing-actions"><button className="primary" onClick={onBegin}>{inquest ? 'Begin the inquest' : 'Open the works'}</button></footer></section></main>;
}

export function formatElapsedTime(elapsedSeconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${totalMinutes}:${String(seconds).padStart(2, '0')}`;
}
