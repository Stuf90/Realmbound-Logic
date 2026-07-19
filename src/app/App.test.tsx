import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App, formatElapsedTime } from './App';

afterEach(cleanup);

describe('puzzle navigation', () => {
  beforeEach(() => localStorage.clear());

  it('shows every puzzle family as one ledger button', () => {
    render(<App />);

    const families = [
      'Royal Inquest',
      'Siege Lines',
      'Leyline Weaving',
      'Celestial Binding',
      'Living Laws',
    ];

    expect(screen.getByRole('region', { name: 'Puzzle families' })).toBeInTheDocument();
    for (const name of families) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument();
    }

    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('button', { name: /Royal Inquest/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Siege Lines/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Leyline Weaving/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Celestial Binding/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Living Laws/ })).toBeDisabled();
  });

  it('opens a family from its ledger row', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));

    expect(screen.getByRole('list', { name: 'Royal Inquest levels' })).toBeInTheDocument();
  });

  it('shows forty levels with only the authored level enabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));

    const levelGrid = screen.getByRole('list', { name: 'Royal Inquest levels' });
    const levels = within(levelGrid).getAllByRole('button');
    expect(levels).toHaveLength(40);
    expect(within(levelGrid).getByRole('button', { name: /^Level 1\b/ })).toBeEnabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 2\b/ })).toBeDisabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 40\b/ })).toBeDisabled();
  });

  it('marks a persisted completed level', async () => {
    localStorage.setItem('realmbound:blackwood-keep', JSON.stringify({
      schemaVersion: 1,
      puzzleId: 'blackwood-keep',
      state: {},
      elapsedSeconds: 1,
      completed: true,
      hintsUsed: 0,
      checksUsed: 0,
    }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));

    expect(screen.getByRole('status', { name: 'Completed' })).toBeInTheDocument();
  });

  it('does not mark an incomplete level', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));

    expect(screen.queryByRole('status', { name: 'Completed' })).not.toBeInTheDocument();
  });

  it('offers to reset a completed puzzle and shows its completion time', async () => {
    localStorage.setItem('realmbound:blackwood-keep', JSON.stringify({
      schemaVersion: 1,
      puzzleId: 'blackwood-keep',
      state: {},
      elapsedSeconds: 125,
      completed: true,
      hintsUsed: 0,
      checksUsed: 1,
    }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));

    expect(screen.getByRole('dialog', { name: 'Replay completed puzzle?' })).toBeInTheDocument();
    expect(screen.getByText('Completed in 2:05')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('cancels replay without changing the completed save', async () => {
    const save = { schemaVersion: 1, puzzleId: 'blackwood-keep', state: {}, elapsedSeconds: 125, completed: true, hintsUsed: 0, checksUsed: 1 };
    localStorage.setItem('realmbound:blackwood-keep', JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Royal Inquest levels' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('realmbound:blackwood-keep') ?? 'null')).toEqual(save);
  });

  it('resets only the completed puzzle and starts it immediately', async () => {
    localStorage.setItem('realmbound:blackwood-keep', JSON.stringify({ schemaVersion: 1, puzzleId: 'blackwood-keep', state: {}, elapsedSeconds: 125, completed: true, hintsUsed: 0, checksUsed: 1 }));
    localStorage.setItem('realmbound:highgate-passage', JSON.stringify({ schemaVersion: 1, puzzleId: 'highgate-passage', state: {}, elapsedSeconds: 70, completed: true, hintsUsed: 0, checksUsed: 1 }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Reset and replay' }));

    expect(JSON.parse(localStorage.getItem('realmbound:blackwood-keep') ?? 'null')).toMatchObject({
      puzzleId: 'blackwood-keep',
      elapsedSeconds: 0,
      completed: false,
    });
    expect(localStorage.getItem('realmbound:highgate-passage')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Begin the inquest' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check progress' })).toBeInTheDocument();
  });

  it('uses the completed replay flow for Siege Lines', async () => {
    localStorage.setItem('realmbound:highgate-passage', JSON.stringify({ schemaVersion: 1, puzzleId: 'highgate-passage', state: {}, elapsedSeconds: 3661, completed: true, hintsUsed: 0, checksUsed: 1 }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Select Siege Lines/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    expect(screen.getByText('Completed in 1:01:01')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset and replay' }));

    expect(screen.queryByRole('button', { name: 'Open the works' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check progress' })).toBeInTheDocument();
  });

  it('opens the selected level briefing and puzzle', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    expect(screen.getByRole('button', { name: 'Begin the inquest' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));
    expect(screen.getByRole('button', { name: 'Check progress' })).toBeInTheDocument();
  });

  it('returns through the puzzle navigation hierarchy', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Siege Lines/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Back to Siege Lines levels' }));
    expect(screen.getByRole('heading', { name: 'Siege Lines' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to puzzle families' }));
    expect(screen.getByRole('heading', { name: /The King.s Ledger/ })).toBeInTheDocument();
  });

  it('returns from a puzzle to its level selection', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));
    await user.click(screen.getByRole('button', { name: 'Back to Royal Inquest levels' }));

    expect(screen.getByRole('list', { name: 'Royal Inquest levels' })).toBeInTheDocument();
  });
});

describe('elapsed time formatting', () => {
  it.each([
    [125, '2:05'],
    [3661, '1:01:01'],
    [-4, '0:00'],
    [Number.NaN, '0:00'],
  ])('formats %s seconds as %s', (seconds, expected) => {
    expect(formatElapsedTime(seconds)).toBe(expected);
  });
});

describe('puzzle play', () => {
  beforeEach(() => localStorage.clear());

  it('places a character and provides progress controls', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));
    await user.click(screen.getByRole('button', { name: /The Royal Envoy/ }));
    await user.click(screen.getByRole('gridcell', { name: /Row 1, column 2/ }));
    expect(screen.getByRole('gridcell', { name: /Royal Envoy/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check progress' })).toBeInTheDocument();
  });
});
