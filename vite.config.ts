import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import process from "node:process";
import { Readable } from "node:stream";
import launchSession from "./api/launch-session.js";

function localLaunchSession(): Plugin {
  const install: NonNullable<Plugin["configureServer"]> = server => {
    server.middlewares.use("/api/launch-session", async (req, res) => {
      const request = new Request("http://" + req.headers.host + "/api/launch-session", {
        method: req.method,
        headers: req.headers as HeadersInit,
        ...(req.method === "POST" ? { body: Readable.toWeb(req), duplex: "half" } : {}),
      } as RequestInit);
      const response = await launchSession.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    });
  };
  return { name: "local-launch-session", configureServer: install, configurePreviewServer: install };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), "PAROQUIAL_"));
  return {
    plugins: [react(), tailwindcss(), localLaunchSession()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
    },
  };
});
