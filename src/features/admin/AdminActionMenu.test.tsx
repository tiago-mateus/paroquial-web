import { fireEvent, render, screen } from '@testing-library/react';
import { Copy, Trash2, ArrowUp } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { AdminActionMenu } from './AdminActionMenu';

describe('AdminActionMenu', () => {
  it('opens by keyboard, skips disabled items and restores focus on Escape', () => {
    render(<AdminActionMenu label="Evento" actions={[
      { label: 'Mover para cima', icon: ArrowUp, disabled: true, onClick: vi.fn() },
      { label: 'Duplicar', icon: Copy, onClick: vi.fn() },
      { label: 'Excluir', icon: Trash2, danger: true, onClick: vi.fn() },
    ]} />);
    const trigger = screen.getByRole('button', { name: 'Mais ações: Evento' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Duplicar' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Duplicar' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('runs an action once and closes, and dismisses on outside pointerdown', () => {
    const action = vi.fn();
    render(<AdminActionMenu label="Canal" actions={[{ label: 'Duplicar', icon: Copy, onClick: action }]} />);
    const trigger = screen.getByRole('button', { name: 'Mais ações: Canal' });
    fireEvent.click(trigger);
    fireEvent.scroll(window);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicar' }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
