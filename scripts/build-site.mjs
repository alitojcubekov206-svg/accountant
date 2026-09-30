import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
  stdio: "inherit",
  env: { ...process.env, SITE_STATIC_EXPORT: "1", NEXT_TELEMETRY_DISABLED: "1" },
});
if (result.error) {
  console.error("Не удалось запустить сборку публичного сайта.");
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = resolve("dist");
if (resolve(process.cwd()) !== projectRoot || dirname(artifactRoot) !== projectRoot) throw new Error("Unexpected build output path.");
// Rebuild only this project's generated artifact so old chunks cannot enter a new release.
await rm(artifactRoot, { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await cp("out", "dist/client", { recursive: true });
await build({ entryPoints: ["worker/index.ts"], outfile: "dist/server/index.js", bundle: true, format: "esm", platform: "browser", target: "es2022", external: ["node:*", "cloudflare:*"], minify: true });
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
const local = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
await writeFile("dist/server/wrangler.json", JSON.stringify({
  name: local.name, main: "index.js", compatibility_date: local.compatibility_date,
  compatibility_flags: local.compatibility_flags,
  assets: { directory: "../client", binding: "ASSETS", run_worker_first: true, html_handling: "none" },
}, null, 2));
console.log("Worker, assets and migrations packaged in dist. Runtime secrets excluded.");
