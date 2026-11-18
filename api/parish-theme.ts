import { get, put } from "@vercel/blob";
import { parseTheme } from "../src/shared/theme/palette.js";
import launchSession from "./launch-session.js";

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const tenant = url.searchParams.get("tenant") ?? "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenant) || tenant.length > 64) return json({ code: "INVALID_TENANT" }, 400);
    if (request.method !== "GET" && request.method !== "PUT") return json({ code: "METHOD_NOT_ALLOWED" }, 405);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const path = "parish-themes/" + tenant + ".json";

    try {
      if (request.method === "GET") {
        if (!token) return json({ storage: "browser", theme: null });
        const result = await get(path, { access: "private", useCache: false, token });
        if (!result) return json({ storage: "shared", theme: null });
        if (result.statusCode !== 200) return json({ code: "THEME_UNAVAILABLE" }, 503);
        const theme = parseTheme(await new Response(result.stream).json());
        return json({ storage: "shared", theme });
      }

      if (request.headers.get("origin") !== url.origin) return json({ code: "FORBIDDEN" }, 403);
      const auth = await launchSession.fetch(new Request(request.url, { headers: request.headers }));
      if (!auth.ok) return auth;
      const session = await auth.json();
      if (!session.adminTenants.some((item: { slug: string }) => item.slug === tenant)) return json({ code: "FORBIDDEN" }, 403);
      if (!token) return json({ code: "STORAGE_UNAVAILABLE" }, 503);
      const theme = parseTheme(await request.json().catch(() => null));
      if (!theme) return json({ code: "INVALID_THEME" }, 400);
      await put(path, JSON.stringify(theme), { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json", token });
      return json({ storage: "shared", theme });
    } catch {
      return json({ code: "THEME_UNAVAILABLE" }, 503);
    }
  },
};
