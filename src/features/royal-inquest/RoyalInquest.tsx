import { useEffect, useMemo, useRef, useState } from 'react';
import { createHistory, commitHistory, redoHistory, undoHistory } from '../../shared/history';
import { loadPuzzle, savePuzzle } from '../../shared/persistence';
import { positionKey } from '../../shared/geometry';
import { royalInquestAssets } from '../../assets/royal-inquest/manifest';
import { getRoyalInquestHint } from './hints';
import { createInitialState, reduceRoyalInquest } from './reducer';
import { getAllClueStates, getCellState, getCluesForSuspect, getGeneralClues, isRoyalInquestComplete } from './selectors';
import { resolveClueText } from './skin';
import type { RoyalInquestLevel, RoyalInquestState } from './types';
import '../../app/puzzle.css';

function hashRoomId(roomId: string): number {
  let hash = 0;
  for (let index = 0; index < roomId.length; index += 1) hash = (hash * 31 + roomId.charCodeAt(index)) >>> 0;
  return hash;
}

export function RoyalInquest({ level, onBack }: { level: RoyalInquestLevel; onBack: () => void }) {
  const { definition, skin } = level;
  const restored = useMemo(() => loadPuzzle<RoyalInquestState>(definition.id), [definition.id]);
  const [history, setHistory] = useState(() => {
    if (!restored?.state) return createHistory(createInitialState(definition));
    const { drafts, manualCrosses, ...rest } = restored.state;
    return createHistory({ ...rest, drafts: drafts ?? {}, manualCrosses: manualCrosses ?? {} });
  });
  const [status, setStatus] = useState(
    restored ? 'Your inquest was restored.' : 'A person of interest is highlighted. Choose a chamber cell, or pick someone else.',
  );
  const [seconds, setSeconds] = useState(restored?.elapsedSeconds ?? 0);
  const [hints, setHints] = useState(restored?.hintsUsed ?? 0);
  const [suspectIndex, setSuspectIndex] = useState(0);
  const [conflictCellKey, setConflictCellKey] = useState<string | null>(null);
  const [dossierOpen, setDossierOpen] = useState(true);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const state = history.present;
  const complete = isRoyalInquestComplete(definition, state.placements);

  useEffect(() => {
    if (complete) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, [complete]);
  function persist() {
    savePuzzle({ schemaVersion: 1, puzzleId: definition.id, state, elapsedSeconds: seconds, completed: complete, hintsUsed: hints, checksUsed: 0 });
  }
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(persist, [state, seconds, complete, hints]);
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') persistRef.current();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  function dispatch(action: Parameters<typeof reduceRoyalInquest>[1], meaningful = true) {
    const next = reduceRoyalInquest(state, action, definition);
    if (meaningful) setHistory((value) => commitHistory(value, next));
    else setHistory((value) => ({ ...value, present: next }));
  }
  function activate(row: number, column: number) {
    const selected = state.selectedSuspectId;
    if (!selected) return setStatus('Select a person of interest first.');
    if (state.tool === 'cross') dispatch({ type: 'toggle-cross', suspectId: selected, position: { row, column } });
    else if (state.tool === 'draft') dispatch({ type: 'toggle-draft', suspectId: selected, position: { row, column } });
    else {
      const next = reduceRoyalInquest(state, { type: 'place', suspectId: selected, position: { row, column } }, definition);
      if (next === state) {
        const rowOrColumnTaken = Object.entries(state.placements).some(
          ([placedSuspectId, position]) => placedSuspectId !== selected && position && (position.row === row || position.column === column),
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
  function reset() {
    if (window.confirm('Erase the current inquest and begin again?')) {
      setHistory(createHistory(createInitialState(definition)));
      setSuspectIndex(0);
      setSeconds(0);
      setHints(0);
      setStatus('The inquest has been reset.');
    }
  }
  function focusCell(row: number, column: number) {
    const target = boardRef.current?.querySelector<HTMLButtonElement>(`[data-row="${row}"][data-column="${column}"]`);
    if (target && !target.disabled) target.focus();
  }
  function goToSuspect(index: number) {
    const nextIndex = (index + definition.suspects.length) % definition.suspects.length;
    setSuspectIndex(nextIndex);
    dispatch({ type: 'select-suspect', suspectId: definition.suspects[nextIndex]!.id }, false);
  }

  const visibleSuspect = definition.suspects[suspectIndex]!;
  const visibleSuspectClues = useMemo(() => getCluesForSuspect(definition, visibleSuspect.id), [definition, visibleSuspect.id]);
  const generalClues = useMemo(() => getGeneralClues(definition), [definition]);
  const clueStates = useMemo(() => getAllClueStates(definition, state.placements), [definition, state.placements]);
  const roomAnchorKeys = useMemo(() => {
    const seenRooms = new Set<string>();
    const anchors = new Set<string>();
    for (const cell of definition.cells) {
      if (seenRooms.has(cell.roomId)) continue;
      seenRooms.add(cell.roomId);
      anchors.add(positionKey(cell.position));
    }
    return anchors;
  }, [definition]);
  const cellByKey = useMemo(() => new Map(definition.cells.map((cell) => [positionKey(cell.position), cell])), [definition]);

  const victim = definition.suspects.find(({ isVictim }) => isVictim)!;
  const murderer = definition.suspects.find(({ id }) => id === definition.murdererId)!;
  const victimName = skin.suspects[victim.id]?.name ?? victim.label;
  const murdererName = skin.suspects[murderer.id]?.name ?? murderer.label;
  const victimRoomId = definition.cells.find((cell) => {
    const solved = definition.solution[victim.id];
    return solved !== undefined && positionKey(cell.position) === positionKey(solved);
  })!.roomId;
  const victimRoomName = skin.rooms[victimRoomId]?.name ?? victimRoomId;

  return (
    <main className="app-shell commission-page">
      <header className="app-topbar puzzle-topbar">
        <button className="text-button" onClick={onBack} aria-label="Back to Royal Inquest levels">
          ← Levels
        </button>
        <div>
          <p className="eyebrow">Royal Inquest</p>
          <h1>{level.title}</h1>
        </div>
        <p className="metrics">
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </p>
      </header>
      {complete && (
        <section className="resolution" aria-labelledby="resolution-title">
          <div className="resolution-card">
            <p className="seal">Solved</p>
            <h2 id="resolution-title">The traitor is unmasked</h2>
            <p>
              {murdererName} alone shared {victimRoomName} with {victimName}. The arrangement proves the treachery.
            </p>
            <p className="resolution-stats">
              Solved in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} using {hints} hint{hints === 1 ? '' : 's'}.
            </p>
            <button className="text-button" onClick={onBack}>
              Return to the Ledger
            </button>
          </div>
        </section>
      )}
      <div className="puzzle-layout app-workspace">
        <section className="board-panel" aria-label="Castle floor plan">
          <div className="board-scroll">
            <div
              ref={boardRef}
              className="inquest-board"
              role="grid"
              aria-label={`${level.title}, ${definition.rows} by ${definition.columns}`}
              style={{
                gridTemplateColumns: `repeat(${definition.columns}, minmax(44px, 1fr))`,
                gridTemplateRows: `repeat(${definition.rows}, minmax(44px, 1fr))`,
                aspectRatio: `${definition.columns} / ${definition.rows}`,
                width: `min(100%, calc(100cqh * ${definition.columns} / ${definition.rows}), 34rem)`,
              }}
            >
              {definition.cells.map((cell) => {
                const occupantId = Object.entries(state.placements).find(
                  ([, position]) => position && positionKey(position) === positionKey(cell.position),
                )?.[0];
                const selected = state.selectedSuspectId;
                const cellState = selected
                  ? getCellState(definition, state, selected, cell.position)
                  : cell.blocked
                    ? 'blocked'
                    : occupantId
                      ? 'occupied'
                      : 'available';
                const occupantSuspect = definition.suspects.find(({ id }) => id === occupantId);
                const occupantName = occupantSuspect ? skin.suspects[occupantSuspect.id]?.name ?? occupantSuspect.label : undefined;
                const draftSuspects = definition.suspects.filter((candidate) =>
                  (state.drafts?.[candidate.id] ?? []).includes(positionKey(cell.position)),
                );
                const isCrossed = cellState === 'manual-cross' || cellState === 'auto-cross';
                const roomName = skin.rooms[cell.roomId]?.name ?? cell.roomId;
                const draftLabel = !isCrossed && draftSuspects.length
                  ? `, noted for ${draftSuspects.map((candidate) => skin.suspects[candidate.id]?.name ?? candidate.label).join(' and ')}`
                  : '';
                const label = `Row ${cell.position.row + 1}, column ${cell.position.column + 1}, ${roomName}, ${occupantName ?? cellState.replace('-', ' ')}${draftLabel}`;
                const environment = skin.rooms[cell.roomId]?.environment ?? 'room';
                const tileVariants = royalInquestAssets.tiles[environment];
                const tileUrl = tileVariants[hashRoomId(cell.roomId) % tileVariants.length];
                const propAssetId = cell.propId ? skin.props[cell.propId]?.assetId : undefined;
                const propUrl = propAssetId ? royalInquestAssets.props[propAssetId] : undefined;
                const isConflict = conflictCellKey === positionKey(cell.position);
                const conflictClass = isConflict ? ' conflict' : '';
                const rightCell = cellByKey.get(positionKey({ row: cell.position.row, column: cell.position.column + 1 }));
                const bottomCell = cellByKey.get(positionKey({ row: cell.position.row + 1, column: cell.position.column }));
                const wallClass = `${rightCell && rightCell.roomId !== cell.roomId ? ' wall-right' : ''}${bottomCell && bottomCell.roomId !== cell.roomId ? ' wall-bottom' : ''}`;
                return (
                  <button
                    key={positionKey(cell.position)}
                    role="gridcell"
                    className={`cell ${cellState}${conflictClass}${wallClass}`}
                    style={{ backgroundImage: `var(--cell-tint), url(${tileUrl})` }}
                    disabled={cell.blocked}
                    aria-label={label}
                    data-row={cell.position.row}
                    data-column={cell.position.column}
                    onClick={() => activate(cell.position.row, cell.position.column)}
                    onKeyDown={(event) => {
                      if (event.key.toLowerCase() === 'x') {
                        event.preventDefault();
                        if (selected) dispatch({ type: 'toggle-cross', suspectId: selected, position: cell.position });
                        return;
                      }
                      const delta = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
                      if (delta) {
                        event.preventDefault();
                        focusCell(cell.position.row + delta[0], cell.position.column + delta[1]);
                      }
                    }}
                  >
                    {propUrl && <img className="cell-prop" src={propUrl} alt="" />}
                    {occupantSuspect && (
                      <img className="cell-avatar" src={royalInquestAssets.avatars[skin.suspects[occupantSuspect.id]!.avatarId]} alt="" />
                    )}
                    {!occupantSuspect && isCrossed && (
                      <span className={`cell-mark ${cellState}`} aria-hidden="true">
                        {cellState === 'manual-cross' ? '×' : '·'}
                      </span>
                    )}
                    {!occupantSuspect && !isCrossed && draftSuspects.length > 0 && (
                      <span className="cell-draft" aria-hidden="true">
                        {draftSuspects.map((candidate) => (skin.suspects[candidate.id]?.name ?? candidate.label)[0]).join('')}
                      </span>
                    )}
                    {!occupantSuspect && !isCrossed && draftSuspects.length === 0 && !propUrl && cell.blocked && '◆'}
                    {roomAnchorKeys.has(positionKey(cell.position)) && (
                      <span className="chamber-label" aria-hidden="true">
                        {roomName}
                      </span>
                    )}
                    <span className="sr-only">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="toolbar" role="toolbar" aria-label="Puzzle actions">
            <button disabled={!history.past.length} onClick={() => setHistory(undoHistory)}>
              Undo
            </button>
            <button disabled={!history.future.length} onClick={() => setHistory(redoHistory)}>
              Redo
            </button>
            <button aria-pressed={state.tool === 'draft'} onClick={() => dispatch({ type: 'set-tool', tool: state.tool === 'place' ? 'draft' : 'place' }, false)}>
              {state.tool === 'place' ? 'Note' : 'Place'}
            </button>
            <button aria-pressed={state.tool === 'cross'} onClick={() => dispatch({ type: 'set-tool', tool: 'cross' }, false)}>
              Cross
            </button>
            <button
              onClick={() => {
                const hint = getRoyalInquestHint(definition, state.placements, skin);
                setHints((count) => count + 1);
                if (!hint) return setStatus('No hint is needed.');
                setStatus(hint.message);
                if (hint.suspectId && hint.position) dispatch({ type: 'place', suspectId: hint.suspectId, position: hint.position });
              }}
            >
              Apply hint
            </button>
            <button onClick={reset}>Reset</button>
          </div>
          <p className="status" role="status">
            {status}
          </p>
          <p className="metrics puzzle-metrics">Hints {hints}</p>
        </section>
        <aside className="dossier">
          <button className="text-button dossier-toggle" aria-expanded={dossierOpen} onClick={() => setDossierOpen((open) => !open)}>
            {dossierOpen ? '▾ Persons of interest' : '▸ Persons of interest'}
          </button>
          <div className={`dossier-content${dossierOpen ? '' : ' collapsed'}`}>
            {generalClues.length > 0 && (
              <section className="general-clue-brief" role="region" aria-live="polite" aria-label="General witness statements">
                <ol>
                  {generalClues.map((clue) => (
                    <li key={clue.id} data-state={clueStates[clue.id]}>
                      {resolveClueText(clue, skin, definition)}
                      {clueStates[clue.id] === 'violated' ? ' ⚠' : clueStates[clue.id] === 'satisfied' ? ' ✓' : ''}
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <section className="character-carousel" aria-label="Persons of interest">
              <div className="carousel-controls">
                <button aria-label="Previous person" onClick={() => goToSuspect(suspectIndex - 1)}>
                  ←
                </button>
                <span aria-live="polite">
                  {suspectIndex + 1} / {definition.suspects.length}
                </span>
                <button aria-label="Next person" onClick={() => goToSuspect(suspectIndex + 1)}>
                  →
                </button>
              </div>
              <button
                className="portrait featured-portrait"
                aria-pressed={state.selectedSuspectId === visibleSuspect.id}
                onClick={() => dispatch({ type: 'select-suspect', suspectId: visibleSuspect.id }, false)}
              >
                <img className="carousel-avatar" src={royalInquestAssets.avatars[skin.suspects[visibleSuspect.id]!.avatarId]} alt="" />
                {skin.suspects[visibleSuspect.id]?.name ?? visibleSuspect.label}
                {visibleSuspect.isVictim && <small>Victim</small>}
              </button>
              <section className="character-clue-brief" role="region" aria-live="polite" aria-label={`Clues about ${skin.suspects[visibleSuspect.id]?.name ?? visibleSuspect.label}`}>
                {visibleSuspectClues.length ? (
                  <ol>
                    {visibleSuspectClues.map((clue) => (
                      <li key={clue.id} data-state={clueStates[clue.id]}>
                        {resolveClueText(clue, skin, definition)}
                        {clueStates[clue.id] === 'violated' ? ' ⚠' : clueStates[clue.id] === 'satisfied' ? ' ✓' : ''}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>No witness statement names {skin.suspects[visibleSuspect.id]?.name ?? visibleSuspect.label} directly.</p>
                )}
              </section>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
