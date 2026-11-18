/// <reference types="node" />
import process from "node:process";
import { parishApiRoutes } from "./src/shared/api/parishApiRoutes";

const slug = process.env.VITE_PAROQUIAL_API_TENANT?.trim();
const apiOrigin = process.env.PAROQUIAL_API_ORIGIN?.trim();
let rewrites: { source: string; destination: string }[] = [];

if (slug) {
  const routes = parishApiRoutes(slug, {
    churches: process.env.VITE_PAROQUIAL_API_CHURCHES === "true",
    highlights: process.env.VITE_PAROQUIAL_API_HIGHLIGHTS === "true",
  });
  const upstream = apiOrigin && URL.canParse(apiOrigin) ? new URL(apiOrigin) : undefined;
  if (!routes.length || !upstream || upstream.protocol !== "https:" ||
      (apiOrigin !== upstream.origin && apiOrigin !== upstream.origin + "/")) {
    throw new Error("Configure VITE_PAROQUIAL_API_TENANT com um slug válido e PAROQUIAL_API_ORIGIN com a origem HTTPS da API.");
  }
  rewrites = [...new Set(routes.map(route => route.path))].map(source => ({
    source,
    destination: upstream.origin + source,
  }));
}

export const config = {
  rewrites: [...rewrites, { source: "/((?!api/).*)", destination: "/index.html" }],
};
