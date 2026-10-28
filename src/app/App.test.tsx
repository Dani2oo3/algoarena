import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('AlgoArena application flows', () => {
  it('navigates between both algorithm arenas from the dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /explore pathfinding/i }));
    expect(screen.getByRole('heading', { name: /map the route/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Sorting' }));
    expect(screen.getByRole('heading', { name: /order the field/i })).toBeTruthy();
  });

  it('completes a valid sorting challenge once and reports the points', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Challenges' }));
    const card = screen.getByRole('heading', { name: 'Repeat Storm' }).closest('article');
    expect(card).not.toBeNull();
    await user.click(within(card!).getByRole('button', { name: /enter challenge/i }));
    await user.click(screen.getByRole('button', { name: 'Run algorithm' }));
    expect(screen.getByRole('heading', { name: /measure the run/i })).toBeTruthy();
    expect(screen.getByText('SESSION SCORE').parentElement?.textContent).toContain('80');
    await user.click(screen.getByRole('button', { name: 'Challenges' }));
    await user.click(
      within(screen.getByRole('heading', { name: 'Repeat Storm' }).closest('article')!).getByRole(
        'button',
        { name: /practice again/i },
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Run algorithm' }));
    expect(screen.getByText('SESSION SCORE').parentElement?.textContent).toContain('80');
    expect(screen.getByText('SESSION SCORE').parentElement?.textContent).not.toContain('160');
  });

  it('starts a no-route challenge only from its verified blocked map', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Challenges' }));
    const card = screen.getByRole('heading', { name: 'Prove the Dead End' }).closest('article')!;
    await user.click(within(card).getByRole('button', { name: /enter challenge/i }));
    await user.click(screen.getByRole('button', { name: 'Run algorithm' }));
    expect(screen.getAllByText('Prove the Dead End').length).toBeGreaterThan(0);
    expect(screen.getByText('SESSION SCORE').parentElement?.textContent).toContain('125');
    expect(screen.getAllByText(/no route found/i).length).toBeGreaterThan(0);
  });

  it('supports keyboard grid editing and step, pause, resume, and reset controls', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Pathfinding' }));
    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1: empty' });
    fireEvent.click(cell, { detail: 0 });
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1: obstacle' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Run algorithm' }));
    const progress = screen.getByRole('progressbar', { name: 'Playback progress' });
    await user.click(screen.getByRole('button', { name: 'Step' }));
    expect(screen.getByText(/1 \/ \d+ steps/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getAllByText('running').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getAllByText('paused').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getAllByText('running').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(progress.getAttribute('aria-valuenow')).toBe('0');
    expect(screen.getAllByText('idle').length).toBeGreaterThan(0);
  });
});
