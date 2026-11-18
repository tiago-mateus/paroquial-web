import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminConfirmDialog } from './AdminConfirmDialog';

describe('AdminConfirmDialog', () => {
  it('keeps failed deletion visible and permits another attempt', () => {
    const confirm = vi.fn();
    render(<AdminConfirmDialog open title="Excluir canal?" description="Canal de contato" pending={false} error={new Error('Falha')} onClose={vi.fn()} onConfirm={confirm} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível excluir. Tente novamente.');
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(confirm).toHaveBeenCalledOnce();
  });
  it('contains keyboard focus, prevents dismissal while pending and restores focus', () => {
    const close = vi.fn();
    const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus();
    const props = { open: true, title: 'Excluir canal?', description: 'Canal de contato', pending: false, onClose: close, onConfirm: vi.fn() };
    const view = render(<AdminConfirmDialog {...props} />);
    const cancel = screen.getByRole('button', { name: 'Cancelar' });
    const remove = screen.getByRole('button', { name: 'Excluir' });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: 'Tab', shiftKey: true });
    expect(remove).toHaveFocus();
    fireEvent.keyDown(remove, { key: 'Tab' });
    expect(cancel).toHaveFocus();
    view.rerender(<AdminConfirmDialog {...props} pending />);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(screen.getByRole('alertdialog').parentElement!);
    expect(close).not.toHaveBeenCalled();
    view.rerender(<AdminConfirmDialog {...props} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
    view.unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
