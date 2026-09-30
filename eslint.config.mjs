import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals, ...nextTs,
  // This exported site uses document navigation so the Worker checks the session on
  // every private-page load. Next client routing would bypass that HTTP boundary.
  { rules: { "@next/next/no-html-link-for-pages": "off", "@next/next/no-location-assign-relative-destination": "off" } },
  globalIgnores([".next/**", "out/**", "dist/**", "next-env.d.ts", "test-results/**", "playwright-report/**", ".wrangler/**"]),
]);
