import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarEvent } from '../../../../shared/api/events';
import { AdminEventList } from './AdminEventList';

const event: CalendarEvent = {
  id: 'event', sourceId: 'event', occurrenceId: 'occurrence', tenantSlug: 'sao-jose',
  title: 'Vigília da comunidade', location: '', type: 'adoracao', repeat: 'weekly', repeatWeekdays: [2],
  start: '2026-10-06T23:30:00', end: '2026-10-07T00:30:00',
};

function renderEvent(value: CalendarEvent) {
  const actions = { onEdit: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(), onCreate: vi.fn(), onClearFilters: vi.fn() };
  render(<AdminEventList events={[value]} {...actions} />);
  return actions;
}

describe('AdminEventList', () => {
  it('shows the overnight end date and keeps actions attached to the event', () => {
    const actions = renderEvent(event);
    const row = screen.getByRole('article', { name: event.title });
    expect(screen.getByRole('list', { name: 'Eventos da data selecionada' })).toContainElement(row);
    expect(within(row).getByText('até 00:30')).toBeInTheDocument();
    expect(within(row).getByText('07/10')).toBeInTheDocument();
    expect(within(row).getByText('até 00:30').closest('time')).toHaveAttribute('dateTime', event.end);
    expect(within(row).getByText('Local a definir')).toBeInTheDocument();
    expect(within(row).getByText('Semanal')).toBeInTheDocument();
    expect(within(row).getAllByRole('button', { name: `Editar ${event.title}` })).toHaveLength(1);
    fireEvent.click(within(row).getByRole('button', { name: `Editar ${event.title}` }));
    expect(actions.onEdit).toHaveBeenCalledWith(event);
    fireEvent.click(within(row).getByRole('button', { name: `Mais ações: ${event.title}` }));
    fireEvent.click(screen.getByRole('menuitem', { name: `Duplicar ${event.title}` }));
    expect(actions.onDuplicate).toHaveBeenCalledWith(event);
  });

  it.each([undefined, 'not-a-date', '2026-10-06T22:00:00'])('omits unconfirmed duration when the end is %s', end => {
    renderEvent({ ...event, end });
    expect(screen.queryByText(/^até /)).not.toBeInTheDocument();
    expect(screen.queryByText('1h')).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
