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

  it('shows forty levels with only the authored levels enabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));

    const levelGrid = screen.getByRole('list', { name: 'Royal Inquest levels' });
    const levels = within(levelGrid).getAllByRole('button');
    expect(levels).toHaveLength(40);
    expect(within(levelGrid).getByRole('button', { name: /^Level 1\b/ })).toBeEnabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 2\b/ })).toBeEnabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 3\b/ })).toBeEnabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 4\b/ })).toBeEnabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 5\b/ })).toBeEnabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 6\b/ })).toBeDisabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 40\b/ })).toBeDisabled();
  });

  it('marks a persisted completed level', async () => {
    localStorage.setItem('realmbound:easy-02', JSON.stringify({
      schemaVersion: 1,
      puzzleId: 'easy-02',
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
    localStorage.setItem('realmbound:easy-02', JSON.stringify({
      schemaVersion: 1,
      puzzleId: 'easy-02',
      state: {},
      elapsedSeconds: 125,
      completed: true,
      hintsUsed: 0,
      checksUsed: 1,
    }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));

    expect(screen.getByRole('dialog', { name: 'Replay completed puzzle?' })).toBeInTheDocument();
    expect(screen.getByText('Completed in 2:05')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('cancels replay without changing the completed save', async () => {
    const save = { schemaVersion: 1, puzzleId: 'easy-02', state: {}, elapsedSeconds: 125, completed: true, hintsUsed: 0, checksUsed: 1 };
    localStorage.setItem('realmbound:easy-02', JSON.stringify(save));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Royal Inquest levels' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('realmbound:easy-02') ?? 'null')).toEqual(save);
  });

  it('resets only the completed puzzle and starts it immediately', async () => {
    localStorage.setItem('realmbound:easy-02', JSON.stringify({ schemaVersion: 1, puzzleId: 'easy-02', state: {}, elapsedSeconds: 125, completed: true, hintsUsed: 0, checksUsed: 1 }));
    localStorage.setItem('realmbound:highgate-passage', JSON.stringify({ schemaVersion: 1, puzzleId: 'highgate-passage', state: {}, elapsedSeconds: 70, completed: true, hintsUsed: 0, checksUsed: 1 }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Reset and replay' }));

    expect(JSON.parse(localStorage.getItem('realmbound:easy-02') ?? 'null')).toMatchObject({
      puzzleId: 'easy-02',
      elapsedSeconds: 0,
      completed: false,
    });
    expect(localStorage.getItem('realmbound:highgate-passage')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Begin the inquest' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply hint' })).toBeInTheDocument();
  });

  it('uses the completed replay flow for Siege Lines', async () => {
    localStorage.setItem('realmbound:highgate-passage', JSON.stringify({ schemaVersion: 1, puzzleId: 'highgate-passage', state: {}, elapsedSeconds: 3661, completed: true, hintsUsed: 0, checksUsed: 1 }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Siege Lines/ }));
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
    expect(screen.getByRole('button', { name: 'Apply hint' })).toBeInTheDocument();
  });

  it('opens Level 2 and Level 3 as their own distinct, playable Royal Inquest cases', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    const levelGrid = screen.getByRole('list', { name: 'Royal Inquest levels' });
    await user.click(within(levelGrid).getByRole('button', { name: /^Level 2\b/ }));
    expect(screen.getByRole('heading', { name: 'The Silent Sonata' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));
    expect(screen.getByRole('grid', { name: /The Silent Sonata/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Royal Inquest levels' }));

    await user.click(within(screen.getByRole('list', { name: 'Royal Inquest levels' })).getByRole('button', { name: /^Level 3\b/ }));
    expect(screen.getByRole('heading', { name: 'The Greenhouse Plot' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));
    expect(screen.getByRole('grid', { name: /The Greenhouse Plot/ })).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: /Mistress Della/ }));
    await user.click(screen.getByRole('gridcell', { name: /Row 1, column 2/ }));
    const placedCell = screen.getByRole('gridcell', { name: /Mistress Della/ });
    expect(placedCell).toBeInTheDocument();
    expect(placedCell.querySelector('img')).toHaveAttribute('src', expect.stringContaining('maid'));
    expect(screen.getByRole('button', { name: 'Apply hint' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check progress' })).not.toBeInTheDocument();
  });

  it('drafts a character onto multiple candidate tiles without committing, then places over a draft', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: /Mistress Della/ }));

    await user.click(screen.getByRole('button', { name: 'Note' }));
    await user.click(screen.getByRole('gridcell', { name: /Row 1, column 5/ }));
    await user.click(screen.getByRole('gridcell', { name: /Row 2, column 4/ }));

    const firstDraftCell = screen.getByRole('gridcell', { name: /Row 1, column 5.*noted for Mistress Della/ });
    expect(firstDraftCell).toBeInTheDocument();
    expect(firstDraftCell.querySelector('.cell-draft')).toHaveTextContent('M');
    expect(screen.getByRole('gridcell', { name: /Row 2, column 4.*noted for Mistress Della/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Note' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Place' }));
    await user.click(screen.getByRole('gridcell', { name: /Row 1, column 5/ }));

    const placedCell = screen.getByRole('gridcell', { name: /^Row 1, column 5, the Falconry, Mistress Della$/ });
    expect(placedCell).not.toHaveAccessibleName(/noted for/);
    expect(screen.getByRole('gridcell', { name: /Row 2, column 4.*noted for Mistress Della/ })).toBeInTheDocument();
  });

  it('renders visible chamber name labels and prop art on blocked cells', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));

    const chamberLabels = [...container.querySelectorAll('.chamber-label')].map((el) => el.textContent);
    expect(chamberLabels).toEqual(
      expect.arrayContaining(['the Falconry', 'the Armory', 'the Cloister Walk']),
    );

    const decoratedCell = screen.getByRole('gridcell', { name: /Row 4, column 3,/ });
    expect(decoratedCell.querySelector('.cell-prop')).toHaveAttribute('src', expect.stringContaining('bookshelf'));
  });

  it('lets a character be seated in a chair: the prop and the avatar render together', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 2\b/ }));
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));

    const seatCell = screen.getByRole('gridcell', { name: /Row 1, column 1,/ });
    expect(seatCell.querySelector('.cell-prop')).toHaveAttribute('src', expect.stringContaining('wooden-bench'));
    expect(seatCell).not.toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: 'Next person' }));
    await user.click(screen.getByRole('button', { name: /Handmaiden Evaine/ }));
    await user.click(seatCell);

    expect(seatCell.querySelector('.cell-prop')).toHaveAttribute('src', expect.stringContaining('wooden-bench'));
    expect(seatCell.querySelector('.cell-avatar')).toHaveAttribute('src', expect.stringContaining('maid'));
  });

  it('shows the currently browsed character clues without switching tabs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));

    const elowenBrief = screen.getByRole('region', { name: /Clues about Lady Elowen/i });
    expect(within(elowenBrief).getByText('Lady Elowen is in column 4')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous person' }));

    const victimBrief = screen.getByRole('region', { name: /Clues about Constable Edda/i });
    expect(within(victimBrief).getByText('No witness statement names Constable Edda directly.')).toBeInTheDocument();
  });
});
