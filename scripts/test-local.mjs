import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
for (const [entry, args] of [
  ["scripts/setup-local-site.mjs", []],
  ["scripts/build-site.mjs", []],
  [resolve("node_modules/wrangler/bin/wrangler.js"), ["d1", "migrations", "apply", "accountant-site-local", "--local", "--persist-to", ".wrangler/test-state"]],
  [require.resolve("@playwright/test/cli"), ["test", ...process.argv.slice(2)]],
]) {
  const result = spawnSync(process.execPath, [entry, ...args], { stdio: "inherit" });
  if (result.error || result.status !== 0) process.exit(result.status ?? 1);
}
