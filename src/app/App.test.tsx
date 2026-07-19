import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it("opens the Blackwood Keep briefing from the King's Ledger", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: "The King's Ledger" })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'The Treason at Blackwood Keep' }));

    expect(screen.getByRole('heading', { name: 'The Treason at Blackwood Keep' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Begin the inquest' })).toBeInTheDocument();
  });
});
