import { authHandlers } from "./auth";
import { bannerHandlers } from "./banners";
import { churchHandlers } from "./churches";
import { eventHandlers } from "./events";
import { liturgyHandlers } from "./liturgy";
import { linkHandlers } from "./links";
import { tenantHandlers } from "./tenants";

export const handlers = [...authHandlers, ...tenantHandlers, ...bannerHandlers, ...eventHandlers, ...liturgyHandlers, ...churchHandlers, ...linkHandlers];
