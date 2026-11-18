import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminSectionTabs } from './AdminSectionTabs';

function renderTabs(path: string) {
  return render(<MemoryRouter initialEntries={[`/sao-jose/admin/${path}`]}><Routes><Route path="/:tenantSlug/admin/*" element={<AdminSectionTabs />} /></Routes></MemoryRouter>);
}

describe('AdminSectionTabs', () => {
  it.each([
    ['calendario', 'Áreas da agenda', 'Eventos', 2],
    ['calendario/confissoes', 'Áreas da agenda', 'Horários de confissão', 2],
    ['site/status', 'Áreas do site público', 'Situação', 4],
    ['paroquia/igrejas', 'Áreas da paróquia', 'Igrejas e capelas', 2],
  ])('marks only the current route in %s', (path, label, current, count) => {
    renderTabs(path as string);
    const nav = screen.getByRole('navigation', { name: label as string });
    expect(within(nav).getAllByRole('link')).toHaveLength(count as number);
    expect(within(nav).getAllByRole('link', { current: 'page' })).toHaveLength(1);
    expect(within(nav).getByRole('link', { current: 'page' })).toHaveTextContent(current as string);
  });

  it('navigates between sections for the same parish', () => {
    renderTabs('site');
    fireEvent.click(screen.getByRole('link', { name: 'Canais oficiais' }));
    expect(screen.getByRole('link', { current: 'page' })).toHaveAttribute('href', '/sao-jose/admin/site/canais');
  });

  it('does not add secondary navigation to the dashboard', () => {
    renderTabs('');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
