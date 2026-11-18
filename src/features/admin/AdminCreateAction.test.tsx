import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminCreateAction } from './AdminCreateAction';

describe('AdminCreateAction', () => {
  it('keeps one named control, handler and focus target across layouts', () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<AdminCreateAction label="Novo evento" onClick={onClick} buttonRef={ref} />);
    const button = screen.getByRole('button', { name: 'Novo evento' });
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(ref.current).toBe(button);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    button.focus();
    expect(button).toHaveFocus();
  });

  it.each([{ disabled: true }, { loading: true }])('blocks creation while unavailable: %o', state => {
    const onClick = vi.fn();
    render(<AdminCreateAction label="Nova igreja" onClick={onClick} {...state} />);
    const button = screen.getByRole('button', { name: /Nova igreja/ });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('announces loading without losing the action label', () => {
    render(<AdminCreateAction label="Novo canal" loading />);
    expect(screen.getByRole('button', { name: 'Novo canal' })).toHaveAttribute('aria-busy', 'true');
  });

  it('preserves navigation and blocks unavailable links', () => {
    const onClick = vi.fn();
    const { rerender } = render(<MemoryRouter><AdminCreateAction label="Novo evento" href="/sao-jose/admin/calendario?action=new" onClick={onClick} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Novo evento' })).toHaveAttribute('href', '/sao-jose/admin/calendario?action=new');
    rerender(<MemoryRouter><AdminCreateAction label="Novo evento" href="/sao-jose/admin/calendario?action=new" onClick={onClick} disabled /></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Novo evento' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('respects visibility without rendering an alternative trigger', () => {
    render(<AdminCreateAction label="Novo destaque" visible={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
