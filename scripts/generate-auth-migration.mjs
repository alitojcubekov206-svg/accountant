import { build } from "esbuild";
import { DatabaseSync } from "node:sqlite";
import { getMigrations } from "better-auth/db/migration";
import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const destination = "drizzle/0000_site_accounts.sql";
try { await access(destination); throw new Error("Initial migration exists. Create a new migration for future changes."); }
catch (error) { if (error.code !== "ENOENT") throw error; }
await mkdir(".wrangler", { recursive: true });
await build({ entryPoints: ["worker/auth.ts"], outfile: ".wrangler/auth-generator.mjs", bundle: true, platform: "node", format: "esm", packages: "external" });
const { createAuth } = await import(pathToFileURL(resolve(".wrangler/auth-generator.mjs")));
const db = new DatabaseSync(":memory:");
const { randomBytes } = await import("node:crypto");
const auth = createAuth({ DB: db, SITE_URL: "http://127.0.0.1:8787", BETTER_AUTH_SECRET: randomBytes(48).toString("base64url") });
const migration = await getMigrations(auth.options);
const sql = await migration.compileMigrations();
await mkdir("drizzle/meta", { recursive: true });
await writeFile(destination, sql.replace(/;\s*\n/g, ";\n--> statement-breakpoint\n") + "\n");
await writeFile("drizzle/meta/_journal.json", JSON.stringify({ version: "6", dialect: "sqlite", entries: [{ idx: 0, version: "6", when: Date.UTC(2026, 8, 30), tag: "0000_site_accounts", breakpoints: true }] }, null, 2));
db.close();
console.log("Initial identity migration generated from Better Auth configuration.");
