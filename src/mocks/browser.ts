import { setupWorker } from "msw/browser";
import { launchMode } from "../shared/launchMode";
import { dataHandlers, handlers } from "./handlers";

export const worker = setupWorker(...(launchMode ? dataHandlers : handlers));
