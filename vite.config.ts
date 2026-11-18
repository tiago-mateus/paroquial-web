import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import process from "node:process";
import { Readable } from "node:stream";
import launchSession from "./api/launch-session.js";
import parishTheme from "./api/parish-theme";

function localLaunchSession(): Plugin {
  const install: NonNullable<Plugin["configureServer"]> = server => {
    for (const [path, handler] of Object.entries({ "/api/launch-session": launchSession, "/api/parish-theme": parishTheme })) {
      server.middlewares.use(path, async (req, res, next) => {
        try {
          const search = new URL(req.url ?? "/", "http://localhost").search;
          const request = new Request("http://" + req.headers.host + path + search, {
            method: req.method,
            headers: req.headers as HeadersInit,
            ...(["POST", "PUT"].includes(req.method ?? "") ? { body: Readable.toWeb(req), duplex: "half" } : {}),
          } as RequestInit);
          const response = await handler.fetch(request);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    }
  };
  return { name: "local-launch-session", configureServer: install, configurePreviewServer: install };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ["PAROQUIAL_", "BLOB_"]));
  return {
    plugins: [react(), tailwindcss(), localLaunchSession()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
    },
  };
});
