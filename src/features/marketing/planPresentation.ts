import { plans } from './offer';

/** Organize the existing catalog for display without changing the offer. */
export function getPlanDetails(plan: (typeof plans)[number]) {
  const inherited = plan.features.some(({ label }) => label === 'Tudo do Premium')
    ? plans.find(({ id }) => id === 'premium') : undefined;
  const capacities = (inherited ?? plan).features.filter(({ label, pending }) => !pending && /links|eventos/i.test(label));
  const included = plan.features.filter(({ pending }) => !pending);
  const resources = included.filter(({ label }) => !/links|eventos/i.test(label));
  const pending = [...plan.features, ...(inherited?.features ?? [])].filter((feature) => feature.pending);
  return { capacities, included, resources, pending };
}
