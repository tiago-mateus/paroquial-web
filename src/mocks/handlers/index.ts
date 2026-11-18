import { authHandlers } from "./auth";
import { bannerHandlers } from "./banners";
import { churchHandlers } from "./churches";
import { eventHandlers } from "./events";
import { liturgyHandlers } from "./liturgy";
import { linkHandlers } from "./links";
import { tenantHandlers } from "./tenants";
import { onboardingHandlers } from "./onboarding";

export const dataHandlers = [ ...tenantHandlers, ...bannerHandlers, ...eventHandlers, ...liturgyHandlers, ...churchHandlers, ...linkHandlers];

export const handlers = [...onboardingHandlers, ...authHandlers, ...dataHandlers];
