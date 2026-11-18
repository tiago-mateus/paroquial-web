import { neon } from "@neondatabase/serverless";
import console from "node:console";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { URL } from "node:url";

const connection = process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();
if (!connection) {
  console.error("Defina DATABASE_URL_UNPOOLED para a branch do Neon que receberá a migração.");
  process.exit(1);
}

try {
  if (new URL(connection).hostname.includes("-pooler")) {
    console.error("Use a conexão direta do Neon em DATABASE_URL_UNPOOLED para aplicar a migração.");
    process.exit(1);
  }
  const sql = neon(connection);
  const migration = await readFile(new URL("../db/migrations/001_parish_themes.sql", import.meta.url), "utf8");
  await sql.query(migration);
  console.log("Migração 001 aplicada: public.parish_themes.");
} catch {
  console.error("Não foi possível aplicar a migração 001. Confira a conexão e a permissão de criar tabelas.");
  process.exitCode = 1;
}
