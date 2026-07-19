import { useEffect, useMemo, useState } from 'react';
import { createHistory, commitHistory, redoHistory, undoHistory } from '../../shared/history';
import { loadPuzzle, savePuzzle } from '../../shared/persistence';
import { positionKey } from '../../shared/geometry';
import { blackwoodKeep } from './definition';
import { getInquestHint } from './hints';
import { createInitialInquestState, reduceInquest } from './reducer';
import { getCellState } from './selectors';
import { checkInquestProgress, isInquestComplete } from './validation';
import type { InquestState } from './types';

export function RoyalInquest({ onBack }: { onBack: () => void }) {
  const restored = useMemo(() => loadPuzzle<InquestState>(blackwoodKeep.id), []);
  const [history, setHistory] = useState(() => createHistory(restored?.state ?? createInitialInquestState()));
  const [status, setStatus] = useState(restored ? 'Your inquest was restored.' : 'Select a character, then choose a chamber cell.');
  const [seconds, setSeconds] = useState(restored?.elapsedSeconds ?? 0);
  const [hints, setHints] = useState(restored?.hintsUsed ?? 0);
  const [checks, setChecks] = useState(restored?.checksUsed ?? 0);
  const state = history.present;
  const complete = isInquestComplete(blackwoodKeep, state);

  useEffect(() => { if (complete) return; const id = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => clearInterval(id); }, [complete]);
  useEffect(() => savePuzzle({ schemaVersion: 1, puzzleId: blackwoodKeep.id, state, elapsedSeconds: seconds, completed: complete, hintsUsed: hints, checksUsed: checks }), [state, seconds, complete, hints, checks]);

  function dispatch(action: Parameters<typeof reduceInquest>[1], meaningful = true) {
    const next = reduceInquest(state, action, blackwoodKeep);
    if (meaningful) setHistory((value) => commitHistory(value, next));
    else setHistory((value) => ({ ...value, present: next }));
  }
  function activate(row: number, column: number) {
    const selected = state.selectedCharacterId;
    if (!selected) return setStatus('Select a character first.');
    if (state.tool === 'cross') dispatch({ type: 'toggle-cross', characterId: selected, position: { row, column } });
    else {
      const next = reduceInquest(state, { type: 'place', characterId: selected, position: { row, column } }, blackwoodKeep);
      if (next === state) return setStatus('That chamber cell is unavailable.');
      setHistory((value) => commitHistory(value, next));
    }
  }
  function reset() { if (window.confirm('Erase the current inquest and begin again?')) { setHistory(createHistory(createInitialInquestState())); setSeconds(0); setHints(0); setChecks(0); setStatus('The inquest has been reset.'); } }

  return <main className="commission-page">
    <button className="text-button" onClick={onBack}>← King’s Ledger</button>
    <header className="commission-header"><p className="eyebrow">Royal Commission · Grand Investigator</p><h1>{blackwoodKeep.title}</h1><p>Place each guest. Exactly one belongs in every row and column. Lord Aldric, alone with the slain envoy, is the traitor.</p></header>
    {complete && <section className="resolution" aria-labelledby="resolution-title"><p className="seal">Solved</p><h2 id="resolution-title">The traitor is unmasked</h2><p>Lord Aldric alone shared the Solar with the Royal Envoy. The chamber arrangement proves his treason.</p></section>}
    <div className="puzzle-layout">
      <section className="board-panel" aria-label="Castle floor plan">
        <div className="inquest-board" role="grid" aria-label="Blackwood Keep, six by six">
          {blackwoodKeep.cells.map((cell) => {
            const occupant = Object.entries(state.placements).find(([, position]) => position && positionKey(position) === positionKey(cell.position))?.[0];
            const selected = state.selectedCharacterId;
            const cellState = selected ? getCellState(blackwoodKeep, state, selected, cell.position) : cell.blocked ? 'blocked' : occupant ? 'occupied' : 'available';
            const character = blackwoodKeep.characters.find(({ id }) => id === occupant);
            const label = `Row ${cell.position.row + 1}, column ${cell.position.column + 1}, ${cell.chamberId.replace('-', ' ')}, ${character?.name ?? cellState.replace('-', ' ')}`;
            return <button key={positionKey(cell.position)} role="gridcell" className={`cell ${cellState}`} disabled={cell.blocked} aria-label={label} onClick={() => activate(cell.position.row, cell.position.column)} onKeyDown={(event) => { if (event.key.toLowerCase() === 'x') { event.preventDefault(); if (selected) dispatch({ type: 'toggle-cross', characterId: selected, position: cell.position }); } }}>{character ? character.portraitLabel.slice(0, 2) : cell.blocked ? '◆' : cellState === 'manual-cross' ? '×' : cellState === 'derived-unavailable' ? '·' : ''}<span className="sr-only">{label}</span></button>;
          })}
        </div>
        <div className="toolbar" aria-label="Inquest controls">
          <button disabled={!history.past.length} onClick={() => setHistory(undoHistory)}>Undo</button><button disabled={!history.future.length} onClick={() => setHistory(redoHistory)}>Redo</button>
          <button aria-pressed={state.tool === 'place'} onClick={() => dispatch({ type: 'set-tool', tool: 'place' }, false)}>Place</button><button aria-pressed={state.tool === 'cross'} onClick={() => dispatch({ type: 'set-tool', tool: 'cross' }, false)}>Ink cross</button>
          <button onClick={() => { setChecks((n) => n + 1); setStatus(checkInquestProgress(blackwoodKeep, state)?.message ?? 'No contradictions found.'); }}>Check progress</button>
          <button onClick={() => { const hint = getInquestHint(blackwoodKeep, state); setHints((n) => n + 1); if (!hint) return setStatus('No hint is needed.'); setStatus(hint.message); if (hint.characterId && hint.position) dispatch({ type: 'place', characterId: hint.characterId, position: hint.position }); }}>Apply hint</button><button onClick={reset}>Reset</button>
        </div>
        <p className="status" role="status">{status}</p><p className="metrics">Time {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} · Hints {hints} · Checks {checks}</p>
      </section>
      <aside className="dossier"><h2>Persons of interest</h2><div className="portraits">{blackwoodKeep.characters.map((character) => <button key={character.id} className="portrait" aria-pressed={state.selectedCharacterId === character.id} onClick={() => dispatch({ type: 'select-character', characterId: character.id }, false)}><span aria-hidden="true">♙</span>{character.name}{character.isVictim && <small>Slain envoy</small>}</button>)}</div><h2>Witness statements</h2><ol>{blackwoodKeep.clues.map((clue) => <li key={clue.id}>{clue.text}</li>)}</ol></aside>
    </div>
  </main>;
}
