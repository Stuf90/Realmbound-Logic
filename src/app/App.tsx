import { useState } from 'react';
import { RoyalInquest } from '../features/royal-inquest/RoyalInquest';
import { SiegeLines } from '../features/siege-lines/SiegeLines';
import { deletePuzzle, loadPuzzle, type PuzzleSave } from '../shared/persistence';
import { getPuzzleFamily, PUZZLE_FAMILIES, type PuzzleFamily, type PuzzleFamilyId } from './puzzleCatalog';
import './app.css';

type View = { kind: 'ledger' } | { kind: 'levels' | 'briefing' | 'puzzle'; familyId: PuzzleFamilyId };
const LEVEL_COUNT = 40;

export function App() {
  const [view, setView] = useState<View>({ kind: 'ledger' });
  if (view.kind === 'ledger') return <PuzzleLedger onSelect={(familyId) => setView({ kind: 'levels', familyId })} />;
  const family = getPuzzleFamily(view.familyId);
  const showLevels = () => setView({ kind: 'levels', familyId: family.id });
  if (view.kind === 'levels') return <LevelSelection family={family} onBack={() => setView({ kind: 'ledger' })} onBriefing={() => setView({ kind: 'briefing', familyId: family.id })} onPlay={() => setView({ kind: 'puzzle', familyId: family.id })} />;
  if (view.kind === 'briefing') return <Briefing family={family} onBack={showLevels} onBegin={() => setView({ kind: 'puzzle', familyId: family.id })} />;
  if (family.id === 'royal-inquest') return <RoyalInquest onBack={showLevels} />;
  if (family.id === 'siege-lines') return <SiegeLines onBack={showLevels} />;
  return null;
}

function PuzzleLedger({ onSelect }: { onSelect: (familyId: PuzzleFamilyId) => void }) {
  const [familyIndex, setFamilyIndex] = useState(0);
  return <main className="app-shell ledger">
    <header className="ledger-header"><p className="eyebrow">His Majesty’s Office of Reason</p><h1>The King’s Ledger</h1><p>Choose a discipline, then select a commission from its record.</p></header>
    <section className="commission-selector app-workspace" role="region" aria-label="Puzzle families">
      <div className="commission-grid">{PUZZLE_FAMILIES.map((family, index) => <article className={`commission-card ${family.accent}${family.available ? '' : ' unavailable'}`} data-active={familyIndex === index} aria-label={family.name} key={family.id}><span className="card-mark" aria-hidden="true">{toRoman(index + 1)}</span><p className="eyebrow">{family.discipline}</p><h2>{family.name}</h2><p>{family.description}</p><button className="primary" disabled={!family.available} onClick={() => onSelect(family.id)} aria-label={`Select ${family.name}${family.available ? '' : ', coming later'}`}>{family.available ? 'Choose puzzle' : 'Coming later'}</button></article>)}</div>
      <nav className="carousel-controls" aria-label="Choose puzzle family"><button aria-label="Previous puzzle family" onClick={() => setFamilyIndex((familyIndex - 1 + PUZZLE_FAMILIES.length) % PUZZLE_FAMILIES.length)}>←</button><span aria-live="polite">{familyIndex + 1} / {PUZZLE_FAMILIES.length}</span><button aria-label="Next puzzle family" onClick={() => setFamilyIndex((familyIndex + 1) % PUZZLE_FAMILIES.length)}>→</button></nav>
    </section>
    <footer className="ledger-footer">Progress is kept automatically in this browser.</footer>
  </main>;
}

function LevelSelection({ family, onBack, onBriefing, onPlay }: { family: PuzzleFamily; onBack: () => void; onBriefing: () => void; onPlay: () => void }) {
  const save = family.levelOne ? loadPuzzle<unknown>(family.levelOne.puzzleId) : null;
  const completed = save?.completed === true;
  const [pendingReplay, setPendingReplay] = useState<PuzzleSave<unknown> | null>(null);
  const selectLevel = () => completed && save ? setPendingReplay(save) : onBriefing();
  const resetAndReplay = () => {
    if (!family.levelOne) return;
    deletePuzzle(family.levelOne.puzzleId);
    setPendingReplay(null);
    onPlay();
  };
  return <main className="app-shell level-page"><header className="app-topbar"><button className="text-button" onClick={onBack} aria-label="Back to puzzle families">← Puzzle families</button></header><section className="level-workspace app-workspace"><header className="level-header"><p className="eyebrow">{family.discipline} · Commission archive</p><h1>{family.name}</h1><p>Select a level. Further commissions will be unsealed as they are prepared.</p></header><ol className="level-grid internal-scroll" aria-label={`${family.name} levels`}>{Array.from({ length: LEVEL_COUNT }, (_, index) => { const level = index + 1; const available = level === 1 && Boolean(family.levelOne); return <li key={level}><button className="level-card" disabled={!available} onClick={available ? selectLevel : undefined} aria-label={available ? `Level ${level}: ${family.levelOne?.title}` : `Level ${level}: sealed`}><span className="level-number">Level {level}</span>{available ? <span className="level-title">{family.levelOne?.title}</span> : <span className="level-locked">Sealed</span>}{available && completed ? <span className="completion-mark" role="status" aria-label="Completed"><span aria-hidden="true">✓</span> Completed</span> : null}</button></li>; })}</ol></section>{pendingReplay ? <div className="replay-backdrop"><section className="replay-dialog" role="dialog" aria-modal="true" aria-labelledby="replay-dialog-title"><p className="eyebrow">Completed commission</p><h2 id="replay-dialog-title">Replay completed puzzle?</h2><p>{family.levelOne?.title}</p><p className="completion-time">Completed in {formatElapsedTime(pendingReplay.elapsedSeconds)}</p><p>Resetting removes the saved solution and starts a fresh attempt immediately.</p><div className="replay-actions"><button autoFocus onClick={() => setPendingReplay(null)}>Cancel</button><button className="primary" onClick={resetAndReplay}>Reset and replay</button></div></section></div> : null}</main>;
}

function Briefing({ family, onBack, onBegin }: { family: PuzzleFamily; onBack: () => void; onBegin: () => void }) {
  const inquest = family.id === 'royal-inquest';
  return <main className="app-shell briefing"><header className="app-topbar"><button className="text-button" onClick={onBack} aria-label={`Back to ${family.name} levels`}>← {family.name} levels</button></header><section className="briefing-sheet app-workspace"><div className="briefing-scroll internal-scroll" role="region" aria-label="Commission briefing"><p className="eyebrow">By order of the Crown</p><h1>{family.levelOne?.title}</h1><p className="dropcap">{inquest ? 'A royal envoy lies slain inside Blackwood Keep. Six witnesses occupied six distinct rows and columns. Arrange them from their testimony, then identify the sole lord who shared the envoy’s chamber.' : 'The northern road has collapsed beneath a siege train. Rebuild one continuous passage between the two gates while satisfying the masons’ count for every line.'}</p><h2>Your charge</h2><ul>{inquest ? <><li>Place one character in every row and column.</li><li>Respect blocked scenery, chamber boundaries, and witness clues.</li><li>Use ink crosses to mark impossible cells.</li></> : <><li>Lay straight and curved road segments.</li><li>Match every connection and numbered line count.</li><li>Prevent branches, loops, and isolated road.</li></>}</ul></div><footer className="briefing-actions"><button className="primary" onClick={onBegin}>{inquest ? 'Begin the inquest' : 'Open the works'}</button></footer></section></main>;
}

function toRoman(value: number): string { return ['I', 'II', 'III', 'IV', 'V'][value - 1] ?? String(value); }

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
