import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { plans } from './offer';

describe('Página de apresentação', () => {
  it('leva o plano escolhido ao cadastro sem passar pelo atendimento', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    for (const plan of plans) {
      for (const link of screen.getAllByRole('link', { name: `Assinar ${plan.name}` })) {
        expect(link).toHaveAttribute('href', `/assinar?plano=${plan.id}`);
      }
    }
    expect(screen.queryByRole('button', { name: 'Anual' })).not.toBeInTheDocument();
  });

  it('atualiza o cadastro e mantém demonstração como ajuda opcional', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Tenho interesse no plano'), { target: { value: 'pro' } });
    expect(screen.getAllByRole('link', { name: 'Assinar Pro' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Solicitar demonstração pelo WhatsApp/ })).toHaveAttribute('href', expect.stringContaining('https://wa.me/'));
  });
});
