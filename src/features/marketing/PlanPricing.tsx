import { ArrowRight, CalendarDays, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlanBenefits } from './PlanBenefits';
import { getPlanDetails } from './planPresentation';
import { money, plans, type PlanId } from './offer';

export function PlanPricing({ onSelect }: { onSelect: (plan: PlanId) => void }) {
  return <section id="planos" aria-labelledby="titulo-planos" className="scroll-mt-6 py-14 md:py-20">
    <div className="mx-auto w-full max-w-[1280px] px-5 md:px-10">
      <div className="mb-8 flex flex-col gap-5 lg:mb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="max-w-2xl">
          <h2 id="titulo-planos" className="m-0 max-w-[20ch] font-display text-4xl font-medium leading-tight tracking-tight md:text-5xl">O plano certo para a sua paróquia.</h2>
          <p className="mb-0 mt-4 max-w-[55ch] text-base leading-7 text-muted">Compare os limites e os recursos. Escolha como você quer organizar a presença digital da sua comunidade.</p>
        </div>
        <span className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-lg bg-selection px-4 text-sm font-semibold text-primary"><CalendarDays size={18} aria-hidden="true" />Assinatura mensal</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-4 xl:gap-6">
        {plans.map((plan) => {
          const { capacities } = getPlanDetails(plan);
          const featured = Boolean(plan.popular);
          return <article key={plan.id} aria-labelledby={`plano-${plan.id}`} aria-describedby="condicoes-planos" className={`flex min-w-0 flex-col overflow-hidden rounded-2xl ${featured ? 'bg-ink text-white' : 'border border-line bg-surface text-ink'}`}>
            <div className="px-5 pb-5 pt-6 xl:px-7 xl:pt-7">
              <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
                <h3 id={`plano-${plan.id}`} className="m-0 font-display text-3xl font-medium leading-tight">{plan.name}</h3>
                {featured ? <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-ink">Em destaque</span> : null}
              </div>
              <p className={`mb-0 mt-3 text-sm leading-6 lg:min-h-14 ${featured ? 'text-white/85' : 'text-muted'}`}>{plan.description}</p>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <strong className="text-[40px] font-semibold leading-tight tracking-tight tabular-nums lg:text-[44px]">{money(plan.monthly)}</strong>
                <span className={`text-sm ${featured ? 'text-white/85' : 'text-muted'}`}>/mês</span>
              </div>
              <Link to={`/assinar?plano=${plan.id}`} onClick={() => onSelect(plan.id)} className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${featured ? 'bg-accent text-accent-ink hover:bg-accent/90' : 'bg-primary text-white hover:bg-primary-hover'}`}>Assinar {plan.name}<ArrowRight size={17} aria-hidden="true" /></Link>
            </div>

            <div className={`flex flex-1 flex-col border-t px-5 py-5 xl:px-7 ${featured ? 'border-white/15' : 'border-line'}`}>
              <dl className={`m-0 grid gap-2 rounded-xl p-3 ${featured ? 'bg-white/10' : 'bg-canvas'}`}>
                {capacities.map(({ label }) => <div key={label} className="text-sm font-semibold leading-6"><dt className="sr-only">{label.toLowerCase().includes('links') ? 'Limite de links' : 'Limite mensal de eventos'}</dt><dd className="m-0 flex items-start gap-2"><span className={`mt-2.5 size-1.5 shrink-0 rounded-full ${featured ? 'bg-accent' : 'bg-primary'}`} aria-hidden="true" />{label}</dd></div>)}
              </dl>
              <p className={`mb-3 mt-5 text-sm font-semibold ${featured ? 'text-white/85' : 'text-muted'}`}>{plan.id === 'pro' ? 'Recursos do portal' : 'Recursos incluídos'}</p>
              <PlanBenefits plan={plan} resourcesOnly tone={featured ? 'dark' : 'light'} />
            </div>
          </article>;
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <p id="condicoes-planos" className="m-0 max-w-[72ch] text-sm leading-6 text-muted">Cobrança mensal com renovação automática. Confira o resumo e os termos antes de pagar. Recursos em definição não estão incluídos na contratação.</p>
        <a href="#assinatura" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-primary hover:underline"><MessageCircle size={18} aria-hidden="true" />Ajuda para escolher<ArrowRight size={16} aria-hidden="true" /></a>
      </div>
    </div>
  </section>;
}
