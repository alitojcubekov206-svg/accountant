import { betterAuth } from "better-auth";

export interface SiteEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  BETTER_AUTH_SECRET: string;
  SITE_URL: string;
}

export const legalVersion = "2026-09-30";

export function createAuth(env: SiteEnv) {
  return betterAuth({
    appName: "Accountant",
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.SITE_URL,
    trustedOrigins: [env.SITE_URL],
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    user: {
      additionalFields: {
        termsVersion: { type: "string", required: true, input: false, defaultValue: legalVersion },
        termsAcceptedAt: { type: "date", required: true, input: false, defaultValue: new Date() },
      },
      deleteUser: { enabled: true },
    },
    advanced: {
      useSecureCookies: env.SITE_URL.startsWith("https://"),
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    rateLimit: {
      enabled: true, storage: "database", window: 60, max: 60,
      customRules: {
        "/sign-up/email": { window: 60, max: 5 },
        "/sign-in/email": { window: 60, max: 10 },
        "/change-password": { window: 60, max: 5 },
        "/delete-user": { window: 60, max: 5 },
      },
    },
    logger: { disabled: true },
  });
}
