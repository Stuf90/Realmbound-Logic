import { useEffect, useMemo, useState } from 'react';
import { createHistory, commitHistory, redoHistory, undoHistory } from '../../shared/history';
import { loadPuzzle, savePuzzle } from '../../shared/persistence';
import { positionKey } from '../../shared/geometry';
import { blackwoodKeep } from './definition';
import { getInquestHint } from './hints';
import { createInitialInquestState, reduceInquest } from './reducer';
import { getCellState, getCluesForCharacter } from './selectors';
import { checkInquestProgress, isInquestComplete } from './validation';
import { getCellPropUrl, getCellTileUrl, getCellWalls, getCharacterAvatarUrl } from './visuals';
import type { InquestState } from './types';

export function RoyalInquest({ onBack }: { onBack: () => void }) {
  const restored = useMemo(() => loadPuzzle<InquestState>(blackwoodKeep.id), []);
  const [history, setHistory] = useState(() => createHistory(restored?.state ?? createInitialInquestState()));
  const [status, setStatus] = useState(restored ? 'Your inquest was restored.' : 'Select a character, then choose a chamber cell.');
  const [seconds, setSeconds] = useState(restored?.elapsedSeconds ?? 0);
  const [hints, setHints] = useState(restored?.hintsUsed ?? 0);
  const [checks, setChecks] = useState(restored?.checksUsed ?? 0);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [conflictCellKey, setConflictCellKey] = useState<string | null>(null);
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
      if (next === state) {
        const rowOrColumnTaken = Object.entries(state.placements).some(
          ([placedCharacterId, position]) =>
            placedCharacterId !== selected && position && (position.row === row || position.column === column),
        );
        if (rowOrColumnTaken) {
          const key = positionKey({ row, column });
          setConflictCellKey(key);
          window.setTimeout(() => setConflictCellKey((current) => (current === key ? null : current)), 600);
        }
        return setStatus('That chamber cell is unavailable.');
      }
      setConflictCellKey(null);
      setHistory((value) => commitHistory(value, next));
    }
  }
  function reset() { if (window.confirm('Erase the current inquest and begin again?')) { setHistory(createHistory(createInitialInquestState())); setSeconds(0); setHints(0); setChecks(0); setStatus('The inquest has been reset.'); } }
  function goToCharacter(index: number) {
    const nextIndex = (index + blackwoodKeep.characters.length) % blackwoodKeep.characters.length;
    setCharacterIndex(nextIndex);
    dispatch({ type: 'select-character', characterId: blackwoodKeep.characters[nextIndex]!.id }, false);
  }

  const visibleCharacter = blackwoodKeep.characters[characterIndex]!;
  const visibleCharacterClues = useMemo(
    () => getCluesForCharacter(blackwoodKeep, visibleCharacter.id),
    [visibleCharacter.id],
  );
  const chamberAnchorKeys = useMemo(() => {
    const seenChambers = new Set<string>();
    const anchors = new Set<string>();
    for (const cell of blackwoodKeep.cells) {
      if (seenChambers.has(cell.chamberId)) continue;
      seenChambers.add(cell.chamberId);
      anchors.add(positionKey(cell.position));
    }
    return anchors;
  }, []);

  return <main className="app-shell commission-page">
    <header className="app-topbar puzzle-topbar"><button className="text-button" onClick={onBack} aria-label="Back to Royal Inquest levels">← Levels</button><div><p className="eyebrow">Royal Inquest</p><h1>{blackwoodKeep.title}</h1></div><p className="metrics">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p></header>
    {complete && <section className="resolution" aria-labelledby="resolution-title"><p className="seal">Solved</p><h2 id="resolution-title">The traitor is unmasked</h2><p>Lord Aldric alone shared the Solar with the Royal Envoy. The chamber arrangement proves his treason.</p></section>}
    <div className="puzzle-layout app-workspace">
      <section className="board-panel puzzle-board-region" aria-label="Castle floor plan">
        <div className="board-scroll">
        <div
          className="inquest-board"
          role="grid"
          aria-label={`Blackwood Keep, ${blackwoodKeep.rows} by ${blackwoodKeep.columns}`}
          style={{
            gridTemplateColumns: `repeat(${blackwoodKeep.columns}, minmax(44px, 1fr))`,
            gridTemplateRows: `repeat(${blackwoodKeep.rows}, minmax(44px, 1fr))`,
            aspectRatio: `${blackwoodKeep.columns} / ${blackwoodKeep.rows}`,
            width: `min(100%, calc(100cqh * ${blackwoodKeep.columns} / ${blackwoodKeep.rows}), 34rem)`,
          }}
        >
          {blackwoodKeep.cells.map((cell) => {
            const occupant = Object.entries(state.placements).find(([, position]) => position && positionKey(position) === positionKey(cell.position))?.[0];
            const selected = state.selectedCharacterId;
            const cellState = selected ? getCellState(blackwoodKeep, state, selected, cell.position) : cell.blocked ? 'blocked' : occupant ? 'occupied' : 'available';
            const character = blackwoodKeep.characters.find(({ id }) => id === occupant);
            const chamberName = blackwoodKeep.chamberNames[cell.chamberId];
            const label = `Row ${cell.position.row + 1}, column ${cell.position.column + 1}, ${chamberName}, ${character?.name ?? cellState.replace('-', ' ')}`;
            const tileUrl = getCellTileUrl(blackwoodKeep, cell);
            const propUrl = getCellPropUrl(cell);
            const walls = getCellWalls(blackwoodKeep, cell);
            const wallClasses = `${walls.right ? ' wall-right' : ''}${walls.bottom ? ' wall-bottom' : ''}`;
            const isConflict = conflictCellKey === positionKey(cell.position);
            const conflictClass = isConflict ? ' conflict' : '';
            return <button key={positionKey(cell.position)} role="gridcell" className={`cell ${cellState}${wallClasses}${conflictClass}`} style={{ backgroundImage: `var(--cell-tint), url(${tileUrl})` }} disabled={cell.blocked} aria-label={label} onClick={() => activate(cell.position.row, cell.position.column)} onKeyDown={(event) => { if (event.key.toLowerCase() === 'x') { event.preventDefault(); if (selected) dispatch({ type: 'toggle-cross', characterId: selected, position: cell.position }); } }}>{propUrl && <img className="cell-prop" src={propUrl} alt="" />}{character && <img className="cell-avatar" src={getCharacterAvatarUrl(character)} alt="" />}{!character && !propUrl && (cell.blocked ? '◆' : cellState === 'manual-cross' ? '×' : cellState === 'auto-cross' ? '·' : '')}{chamberAnchorKeys.has(positionKey(cell.position)) && <span className="chamber-label" aria-hidden="true">{chamberName}</span>}<span className="sr-only">{label}</span></button>;
          })}
        </div></div>
        <div className="toolbar" role="toolbar" aria-label="Puzzle actions">
          <button disabled={!history.past.length} onClick={() => setHistory(undoHistory)}>Undo</button><button disabled={!history.future.length} onClick={() => setHistory(redoHistory)}>Redo</button>
          <button aria-pressed={state.tool === 'place'} onClick={() => dispatch({ type: 'set-tool', tool: 'place' }, false)}>Place</button><button aria-pressed={state.tool === 'cross'} onClick={() => dispatch({ type: 'set-tool', tool: 'cross' }, false)}>Ink cross</button>
          <button onClick={() => { setChecks((n) => n + 1); setStatus(checkInquestProgress(blackwoodKeep, state)?.message ?? 'No contradictions found.'); }}>Check progress</button>
          <button onClick={() => { const hint = getInquestHint(blackwoodKeep, state); setHints((n) => n + 1); if (!hint) return setStatus('No hint is needed.'); setStatus(hint.message); if (hint.characterId && hint.position) dispatch({ type: 'place', characterId: hint.characterId, position: hint.position }); }}>Apply hint</button><button onClick={reset}>Reset</button>
        </div>
        <p className="status internal-scroll" role="status">{status}</p><p className="metrics puzzle-metrics">Hints {hints} · Checks {checks}</p>
      </section>
      <aside className="dossier context-tray">
        <section className="character-carousel" aria-label="Persons of interest">
          <div className="carousel-controls">
            <button aria-label="Previous character" onClick={() => goToCharacter(characterIndex - 1)}>←</button>
            <span aria-live="polite">{characterIndex + 1} / {blackwoodKeep.characters.length}</span>
            <button aria-label="Next character" onClick={() => goToCharacter(characterIndex + 1)}>→</button>
          </div>
          <button className="portrait featured-portrait" aria-pressed={state.selectedCharacterId === visibleCharacter.id} onClick={() => dispatch({ type: 'select-character', characterId: visibleCharacter.id }, false)}><img className="carousel-avatar" src={getCharacterAvatarUrl(visibleCharacter)} alt="" />{visibleCharacter.name}{visibleCharacter.isVictim && <small>Slain envoy</small>}</button>
          <section className="character-clue-brief internal-scroll" role="region" aria-live="polite" aria-label={`Clues about ${visibleCharacter.name}`}>
            {visibleCharacterClues.length ? <ol>{visibleCharacterClues.map((clue) => <li key={clue.id}>{clue.text}</li>)}</ol> : <p>No witness statement names {visibleCharacter.name} directly.</p>}
          </section>
        </section>
      </aside>
    </div>
  </main>;
}
