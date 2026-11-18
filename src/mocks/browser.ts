import { http, passthrough } from "msw";
import { setupWorker } from "msw/browser";
import { parishApiRoutes } from "../shared/api/parishApiRoutes";
import { launchMode } from "../shared/launchMode";
import { dataHandlers, handlers } from "./handlers";

const integratedTenant = import.meta.env.VITE_PAROQUIAL_API_TENANT?.trim() ?? "";
const apiHandlers = parishApiRoutes(integratedTenant)
  .map(({ method, path }) => http[method](path, () => passthrough()));

export const worker = setupWorker(...(launchMode ? [...apiHandlers, ...dataHandlers] : handlers));
