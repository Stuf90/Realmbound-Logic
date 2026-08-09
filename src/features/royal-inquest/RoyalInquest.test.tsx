import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { blackwoodKeep } from './levels/archive/blackwoodKeep';
import { RoyalInquest } from './RoyalInquest';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

function gridCell(container: HTMLElement, row: number, column: number) {
  const cell = container.querySelector(`[data-row="${row}"][data-column="${column}"]`);
  if (!cell) throw new Error(`No gridcell at row ${row}, column ${column}`);
  return cell as HTMLElement;
}

describe('RoyalInquest cell rendering: cross marks vs. notes', () => {
  it('shows an auto-cross over a note, and restores the note once the character is moved away', async () => {
    const user = userEvent.setup();
    const { container } = render(<RoyalInquest definition={blackwoodKeep} onBack={() => {}} />);

    // Aldric is selected by default. Note a cell in row 1 for him.
    await user.click(screen.getByRole('button', { name: 'Note' }));
    await user.click(gridCell(container, 1, 2));
    expect(gridCell(container, 1, 2).querySelector('.cell-draft')).toBeInTheDocument();

    // Switch back to the place tool, then select the envoy (wraps to the last carousel entry).
    await user.click(screen.getByRole('button', { name: 'Place' }));
    await user.click(screen.getByRole('button', { name: 'Previous character' }));
    await user.click(screen.getByRole('button', { name: /Royal Envoy/ }));

    // Place the envoy in the same row as Aldric's noted cell.
    await user.click(gridCell(container, 1, 3));

    // Switch back to Aldric to see the cell from his perspective.
    await user.click(screen.getByRole('button', { name: 'Next character' }));
    await user.click(screen.getByRole('button', { name: /Lord Aldric/ }));

    const notedCell = gridCell(container, 1, 2);
    expect(notedCell.querySelector('.cell-mark.auto-cross')).toBeInTheDocument();
    expect(notedCell.querySelector('.cell-draft')).not.toBeInTheDocument();

    // Move the envoy out of that row/column entirely (a "replace" of the placement).
    await user.click(screen.getByRole('button', { name: 'Previous character' }));
    await user.click(screen.getByRole('button', { name: /Royal Envoy/ }));
    await user.click(gridCell(container, 0, 4));

    await user.click(screen.getByRole('button', { name: 'Next character' }));
    await user.click(screen.getByRole('button', { name: /Lord Aldric/ }));

    const restoredCell = gridCell(container, 1, 2);
    expect(restoredCell.querySelector('.cell-mark.auto-cross')).not.toBeInTheDocument();
    expect(restoredCell.querySelector('.cell-draft')).toBeInTheDocument();
  });

  it('shows a manual cross over a note, and restores the note once the cross is removed', async () => {
    const user = userEvent.setup();
    const { container } = render(<RoyalInquest definition={blackwoodKeep} onBack={() => {}} />);

    // Aldric is selected by default. Note a cell, then ink a manual cross over it.
    await user.click(screen.getByRole('button', { name: 'Note' }));
    await user.click(gridCell(container, 4, 4));
    expect(gridCell(container, 4, 4).querySelector('.cell-draft')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ink cross' }));
    await user.click(gridCell(container, 4, 4));

    const crossedCell = gridCell(container, 4, 4);
    expect(crossedCell.querySelector('.cell-mark.manual-cross')).toBeInTheDocument();
    expect(crossedCell.querySelector('.cell-draft')).not.toBeInTheDocument();

    // Remove the manual cross; the note underneath should reappear.
    await user.click(gridCell(container, 4, 4));

    const restoredCell = gridCell(container, 4, 4);
    expect(restoredCell.querySelector('.cell-mark.manual-cross')).not.toBeInTheDocument();
    expect(restoredCell.querySelector('.cell-draft')).toBeInTheDocument();
  });
});
