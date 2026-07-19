import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('puzzle navigation', () => {
  beforeEach(() => localStorage.clear());

  it('shows current and future puzzle families', () => {
    render(<App />);

    for (const name of [
      'Royal Inquest',
      'Siege Lines',
      'Leyline Weaving',
      'Celestial Binding',
      'Living Laws',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }

    expect(screen.getByRole('button', { name: /Select Leyline Weaving/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Select Celestial Binding/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Select Living Laws/ })).toBeDisabled();
  });

  it('shows forty levels with only the authored level enabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));

    const levelGrid = screen.getByRole('list', { name: 'Royal Inquest levels' });
    const levels = within(levelGrid).getAllByRole('button');
    expect(levels).toHaveLength(40);
    expect(within(levelGrid).getByRole('button', { name: /^Level 1\b/ })).toBeEnabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 2\b/ })).toBeDisabled();
    expect(within(levelGrid).getByRole('button', { name: /^Level 40\b/ })).toBeDisabled();
  });

  it('opens the selected level briefing and puzzle', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    expect(screen.getByRole('button', { name: 'Begin the inquest' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));
    expect(screen.getByRole('button', { name: 'Check progress' })).toBeInTheDocument();
  });

  it('returns through the puzzle navigation hierarchy', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Select Siege Lines/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Back to Siege Lines levels' }));
    expect(screen.getByRole('heading', { name: 'Siege Lines' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to puzzle families' }));
    expect(screen.getByRole('heading', { name: /The King.s Ledger/ })).toBeInTheDocument();
  });
});

describe('puzzle play', () => {
  beforeEach(() => localStorage.clear());

  it('places a character and provides progress controls', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Select Royal Inquest/ }));
    await user.click(screen.getByRole('button', { name: /^Level 1\b/ }));
    await user.click(screen.getByRole('button', { name: 'Begin the inquest' }));
    await user.click(screen.getByRole('button', { name: /The Royal Envoy/ }));
    await user.click(screen.getByRole('gridcell', { name: /Row 1, column 2/ }));
    expect(screen.getByRole('gridcell', { name: /Royal Envoy/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check progress' })).toBeInTheDocument();
  });
});
