import type { Onboarding } from "../features/subscription/subscription.api";
import { banners, churches, currentUser, events, publicLinks, tenants } from "./data";
import { churchAccessByTenant } from "./data/churches";
import { plans } from "../features/marketing/offer";

type DemoState = Onboarding & { loggedIn: boolean; checkoutId?: string; provisionAt?: number; cancelAtPeriodEnd?: boolean };
const key = "paroquial-demo-onboarding-v1";
const empty = (): DemoState => ({ status: "account", user: null, registration: null, loggedIn: false, demo: true });
let memory = empty();
export function saveDemo(state: DemoState) {
  memory = state;
  // Demo data only: passwords, verification secrets and payment data never persist.
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* In-memory demo still works. */ }
}
export function readDemo(): DemoState {
  try { const value = localStorage.getItem(key); if (value) memory = JSON.parse(value) as DemoState; } catch { /* Storage may be unavailable. */ }
  if (memory.registration && !memory.registration.price) {
    const plan = plans.find((item) => item.id === memory.registration?.planId)!;
    memory.registration.price = { amount: Math.round(plan.monthly * 100), currency: "BRL", interval: "month", version: `demo-${plan.id}-v1` };
    saveDemo(memory);
  }
  if (memory.status === "provisioning" && memory.provisionAt && Date.now() >= memory.provisionAt) {
    memory = { ...memory, status: "active", tenantSlug: memory.registration?.parish?.slug };
    saveDemo(memory);
  }
  if (memory.status === "active" && memory.registration?.parish && !tenants.some((tenant) => tenant.slug === memory.tenantSlug)) {
    const parish = memory.registration.parish;
    tenants.push({ id: memory.registration.id, slug: parish.slug, name: parish.name, cidade: parish.city, estado: parish.state, contato: memory.user?.email, theme: {} });
    churchAccessByTenant[parish.slug] = "premium";
  }
  return memory;
}
export function demoOnboarding(): Onboarding {
  const state = readDemo();
  if (!state.loggedIn) return empty();
  const { status, user, registration, tenantSlug } = state;
  return { status, user, registration, tenantSlug, demo: true };
}
export function demoSession() {
  const state = readDemo();
  if (!state.loggedIn || !state.user) return currentUser;
  return {
    user: { id: "demo-signup-user", name: state.user.name, email: state.user.email },
    adminTenants: state.status === "active" && state.registration?.parish ? [{ id: state.registration.id, slug: state.registration.parish.slug, name: state.registration.parish.name, role: "owner" }] : [],
    onboardingRequired: state.status !== "active",
  };
}
export function loginDemo(email: string) {
  const state = readDemo();
  if (state.user?.email.toLowerCase() === email.toLowerCase()) saveDemo({ ...state, loggedIn: true });
  else saveDemo({ ...empty(), loggedIn: true, user: { name: currentUser.user.name, email: currentUser.user.email, emailVerified: true } });
  return demoSession();
}
export function resetDemo() {
  const state = readDemo();
  const index = tenants.findIndex((tenant) => tenant.id === state.registration?.id);
  if (index >= 0) {
    const [created] = tenants.splice(index, 1);
    delete churchAccessByTenant[created.slug];
    for (const records of [banners, churches, events, publicLinks]) {
      for (let record = records.length - 1; record >= 0; record--) {
        if (records[record].tenantSlug === created.slug) records.splice(record, 1);
      }
    }
  }
  memory = empty();
  try { localStorage.removeItem(key); } catch { /* No storage. */ }
}
