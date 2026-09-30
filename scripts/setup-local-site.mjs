import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
try {
  await writeFile(".dev.vars", `SITE_URL="http://127.0.0.1:8787"\nBETTER_AUTH_SECRET="${randomBytes(48).toString("base64url")}"\n`, { flag: "wx", mode: 0o600 });
  console.log("Local environment created. Secret values are not displayed.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Existing local environment preserved.");
}
