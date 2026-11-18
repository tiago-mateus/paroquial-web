/* global Response */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import process from "node:process";
import { URL } from "node:url";

const cookieName = "__Host-paroquial-session";
const ttl = 8 * 60 * 60;

function equal(left, right) {
  const digest = value => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(left), digest(right));
}

export default {
  async fetch(request) {
    const headers = { "Cache-Control": "no-store" };
    const json = (body, status = 200) => Response.json(body, { status, headers });
    const email = process.env.PAROQUIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.PAROQUIAL_ADMIN_PASSWORD;
    const secret = process.env.PAROQUIAL_SESSION_SECRET;
    const tenantSlug = process.env.PAROQUIAL_ADMIN_TENANT || "sao-jose";
    if (!email || !password || !secret || secret.length < 32 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenantSlug)) {
      return json({ code: "AUTH_UNAVAILABLE" }, 503);
    }
    const session = {
      user: { id: "launch-admin", name: "Administrador", email },
      adminTenants: [{ id: tenantSlug, slug: tenantSlug, name: "Paróquia", role: "admin" }],
    };
    const sign = expiration => createHmac("sha256", secret)
      .update(JSON.stringify([email, password, tenantSlug, expiration])).digest("base64url");
    const cookie = (value, age) => cookieName + "=" + value
      + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + age;

    if (request.method === "GET") {
      const token = request.headers.get("cookie")?.split(";").map(value => value.trim())
        .find(value => value.startsWith(cookieName + "="))?.slice(cookieName.length + 1);
      const [expiration, signature] = token?.split(".") ?? [];
      if (!signature || !/^\d{10}$/.test(expiration ?? "") || Number(expiration) <= Date.now() / 1000
          || !equal(signature, sign(expiration))) return json({ code: "UNAUTHORIZED" }, 401);
      return json(session);
    }

    if (request.method !== "POST" && request.method !== "DELETE") return json({ code: "METHOD_NOT_ALLOWED" }, 405);
    if (request.headers.get("origin") !== new URL(request.url).origin) return json({ code: "FORBIDDEN" }, 403);

    if (request.method === "DELETE") {
      return new Response(null, { status: 204, headers: { ...headers, "Set-Cookie": cookie("", 0) } });
    }

    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ code: "BAD_REQUEST" }, 400);
    const input = await request.json().catch(() => null);
    const validEmail = typeof input?.email === "string" && equal(input.email.trim().toLowerCase(), email);
    const validPassword = typeof input?.password === "string" && equal(input.password, password);
    if (!validEmail || !validPassword) {
      await setTimeout(350);
      return json({ code: "INVALID_CREDENTIALS" }, 401);
    }
    const expiration = String(Math.floor(Date.now() / 1000) + ttl);
    return Response.json(session, {
      headers: { ...headers, "Set-Cookie": cookie(expiration + "." + sign(expiration), ttl) },
    });
  },
};
