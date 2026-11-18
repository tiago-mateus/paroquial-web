import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminDesktopNavigation } from './AdminDesktopNavigation';

function renderNavigation(path = '/sao-jose/admin') {
  render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/:tenantSlug/admin/*" element={<AdminDesktopNavigation />} />
  </Routes></MemoryRouter>);
  return screen.getByRole('navigation', { name: 'Navegação administrativa desktop' });
}

describe('AdminDesktopNavigation', () => {
  it('makes all administrative destinations available without opening a menu', () => {
    const navigation = renderNavigation();
    expect(within(navigation).getByRole('link', { name: 'Eventos' })).toHaveAttribute('href', '/sao-jose/admin/calendario');
    expect(within(navigation).getByRole('link', { name: 'Igrejas e capelas' })).toHaveAttribute('href', '/sao-jose/admin/paroquia/igrejas');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /menu administrativo/i })).not.toBeInTheDocument();
  });

  it('keeps the sidebar available after navigating to a subarea', () => {
    const navigation = renderNavigation();
    const destination = within(navigation).getByRole('link', { name: 'Dados e contato' });
    fireEvent.click(destination);
    expect(destination).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('link', { name: 'Paróquia' })).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('link', { name: 'Eventos' })).toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('marks the correct destination and preserves access to the public site', () => {
    const navigation = renderNavigation('/sao-jose/admin/site/canais');
    expect(within(navigation).getByRole('link', { name: 'Canais oficiais' })).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('link', { name: 'Destaques' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Ver site público' })).toHaveAttribute('href', '/sao-jose');
  });
});
