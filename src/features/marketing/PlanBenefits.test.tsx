import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { plans } from './offer';
import { PlanBenefits } from './PlanBenefits';
import { getPlanDetails } from './planPresentation';

describe('Apresentação dos recursos dos planos', () => {
  it('separates pending Premium resources from included benefits', () => {
    render(<PlanBenefits plan={plans.find(({ id }) => id === 'premium')!} />);
    const included = screen.getByRole('list', { name: 'Recursos incluídos no plano Premium' });
    expect(within(included).queryByText('Comunidades')).not.toBeInTheDocument();
    expect(within(included).getByText('Exportação em PDF')).toBeInTheDocument();
    expect(screen.getByText('Comunidades: em definição')).toBeInTheDocument();
    expect(screen.getByText('Fora da contratação atual.')).toBeInTheDocument();
  });

  it('keeps the Basic offer intact when the same resource is pending in Premium', () => {
    render(<PlanBenefits plan={plans.find(({ id }) => id === 'basic')!} />);
    expect(screen.getByText('Comunidades')).toBeInTheDocument();
    expect(screen.queryByText('Fora da contratação atual.')).not.toBeInTheDocument();
  });

  it('shows the confirmed Premium inheritance without promising pending features in Pro', () => {
    const premium = plans.find(({ id }) => id === 'premium')!;
    const pro = plans.find(({ id }) => id === 'pro')!;
    expect(getPlanDetails(pro).capacities).toEqual(getPlanDetails(premium).capacities);
    render(<PlanBenefits plan={pro} />);
    expect(screen.getByText('Todos os recursos confirmados do Premium')).toBeInTheDocument();
    expect(screen.getByText('Comunidades: em definição')).toBeInTheDocument();
  });
});
