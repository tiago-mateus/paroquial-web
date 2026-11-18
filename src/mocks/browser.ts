import { http, passthrough } from "msw";
import { setupWorker } from "msw/browser";
import { parishApiRoutes } from "../shared/api/parishApiRoutes";
import { integratedParishContent, integratedTenant, launchMode } from "../shared/launchMode";
import { dataHandlers, handlers } from "./handlers";

const apiHandlers = parishApiRoutes(integratedTenant, integratedParishContent)
  .map(({ method, path }) => http[method](path, () => passthrough()));

export const worker = setupWorker(...(launchMode ? [...apiHandlers, ...dataHandlers] : handlers));
