import { Check, Clock3 } from 'lucide-react';
import type { plans } from './offer';
import { getPlanDetails } from './planPresentation';

type Plan = (typeof plans)[number];

export function PlanBenefits({ plan, tone = 'light', resourcesOnly = false, columns = false }: {
  plan: Plan;
  tone?: 'light' | 'dark';
  resourcesOnly?: boolean;
  columns?: boolean;
}) {
  const { included, resources, pending } = getPlanDetails(plan);
  return <>
    <ul aria-label={`Recursos incluídos no plano ${plan.name}`} className={`m-0 grid list-none gap-3 p-0 ${columns ? 'sm:grid-cols-2' : ''}`}>
      {(resourcesOnly ? resources : included).map(({ label }) => <li key={label} className="flex items-start gap-2.5 text-sm leading-6">
        <Check size={17} strokeWidth={2} aria-hidden="true" className={`mt-1 shrink-0 ${tone === 'dark' ? 'text-accent' : 'text-primary'}`} />
        <span>{label === 'Tudo do Premium' ? 'Todos os recursos confirmados do Premium' : label}</span>
      </li>)}
    </ul>
    {pending.length ? <div className={`mt-5 flex items-start gap-2 rounded-lg px-3 py-3 text-sm leading-5 ${tone === 'dark' ? 'bg-white/10 text-white/90' : 'bg-selection/60 text-muted'}`}>
      <Clock3 size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
      <p className="m-0"><span className="block font-semibold">{pending.map(({ label }) => label).join(', ')}: em definição</span><span className="mt-1 block">Fora da contratação atual.</span></p>
    </div> : null}
  </>;
}
