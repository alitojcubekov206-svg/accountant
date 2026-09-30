import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";

test("3D, financial example, navigation and responsive layout", async ({ page, isMobile }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ваш бизнес.");
  await expect(page.locator(".scene-wrap")).toHaveAttribute("data-scene-state", "ready", { timeout: 30000 });
  await page.getByRole("button", { name: "Приостановить анимацию" }).click();
  await expect(page.getByRole("button", { name: "Продолжить анимацию" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Сбросить поворот 3D-сцены" }).click();
  if (isMobile) {
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toHaveCount(0);
  }
  await page.screenshot({ path: testInfo.outputPath("hero.png") });
  await page.getByRole("button", { name: "01 · Аванс" }).click();
  await expect(page.getByTestId("profit-value")).toContainText("0");
  await expect(page.getByTestId("cash-value")).toContainText("130 000");
  await page.getByRole("button", { name: "02 · Исполнение" }).click();
  await expect(page.getByTestId("profit-value")).toContainText("30 000");
  await expect(page.getByTestId("cash-value")).toContainText("60 000");
  await expect(page.getByTestId("debt-value")).toContainText("70 000");
  await page.getByRole("button", { name: "03 · Оплата" }).click();
  await expect(page.getByTestId("profit-value")).toContainText("30 000");
  await expect(page.getByTestId("debt-value")).toContainText("0 сом");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("full-page.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("WebGL fallback and reduced motion remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".scene-wrap")).toHaveAttribute("data-scene-state", "fallback");
  await expect(page.getByText("Показана статичная композиция", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить анимацию" })).toBeVisible();
  await page.getByRole("button", { name: "03 · Оплата" }).click();
  await expect(page.getByTestId("cash-value")).toContainText("130 000");
});

test("real registration, reload, isolation, login, password change and deletion", async ({ page, request }, testInfo) => {
  const suffix = randomBytes(8).toString("hex");
  const email = `e2e-${suffix}@example.test`;
  const password = randomBytes(20).toString("base64url");
  const nextPassword = randomBytes(20).toString("base64url");
  await page.goto("/account/");
  await expect(page).toHaveURL(/\/login\//);
  await page.goto("/register/");
  await page.getByLabel("Как к вам обращаться").fill("Тестовый участник");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.locator('input[name="legal"]').check();
  await page.getByRole("button", { name: "Создать аккаунт", exact: true }).click();
  await expect(page).toHaveURL(/\/account\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Тестовый участник");
  await page.reload();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  const anonymous = await request.get("/api/auth/get-session");
  expect(await anonymous.json()).toBeNull();
  const own = await page.request.get("/api/auth/get-session");
  const ownData = await own.json();
  expect(ownData.user.email === email).toBe(true);
  expect("session" in ownData).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("account.png"), fullPage: true });
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/login\//);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/account\//);
  await page.getByLabel("Текущий пароль", { exact: true }).fill(password);
  await page.getByLabel("Новый пароль", { exact: true }).fill(nextPassword);
  await page.getByRole("button", { name: "Сохранить пароль" }).click();
  await expect(page.getByRole("status")).toContainText("Пароль изменён");
  const oldLogin = await request.post("/api/auth/sign-in/email", { headers: { Origin: "http://127.0.0.1:8787", "cf-connecting-ip": "192.0.2.10" }, data: { email, password } });
  expect(oldLogin.ok()).toBe(false);
  await page.getByLabel("Подтвердите паролем").fill(nextPassword);
  await page.locator('.settings-card input[type="checkbox"]').check();
  await page.getByRole("button", { name: "Удалить мой аккаунт" }).click();
  await expect(page).toHaveURL(/\/login\/\?deleted=1/);
  const deletedSession = await page.request.get("/api/auth/get-session");
  expect(await deletedSession.json()).toBeNull();
  const deletedLogin = await request.post("/api/auth/sign-in/email", { headers: { Origin: "http://127.0.0.1:8787", "cf-connecting-ip": "192.0.2.11" }, data: { email, password: nextPassword } });
  expect(deletedLogin.ok()).toBe(false);
});

test("public legal pages and custom 404", async ({ page }, testInfo) => {
  for (const [path, title] of [["terms", "Условия использования"], ["privacy", "Политика конфиденциальности"], ["contact", "Давайте на связи"]]) {
    await page.goto(`/${path}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  }
  await page.goto("/register/");
  await page.screenshot({ path: testInfo.outputPath("registration.png"), fullPage: true });
  const missing = await page.goto("/no-such-page/");
  expect(missing?.status()).toBe(404);
});

test("server rejects cross-origin, missing consent and oversized bodies", async ({ request }) => {
  const body = { name: "Test user", email: "security@example.test", password: randomBytes(20).toString("base64url") };
  const base = { Origin: "http://127.0.0.1:8787", "cf-connecting-ip": "192.0.2.20" };
  expect((await request.post("/api/auth/sign-up/email", { headers: { ...base, Origin: "https://untrusted.example" }, data: { ...body, legalAccepted: true, termsVersion: "2026-09-30" } })).status()).toBe(403);
  expect((await request.post("/api/auth/sign-up/email", { headers: base, data: body })).status()).toBe(400);
  expect((await request.post("/api/auth/sign-up/email", { headers: base, data: { ...body, legalAccepted: true, termsVersion: "old" } })).status()).toBe(400);
  expect((await request.post("/api/auth/sign-up/email", { headers: base, data: { ...body, legalAccepted: true, termsVersion: "2026-09-30", password: "short" } })).status()).toBe(400);
  expect((await request.post("/api/auth/sign-up/email", { headers: base, data: { filler: "x".repeat(9000) } })).status()).toBe(413);
  expect((await request.post("/api/auth/update-user", { headers: base, data: { name: "unauthorized" } })).status()).toBe(404);
  const session = await request.get("/api/auth/get-session");
  expect(session.headers()["cache-control"]).toContain("no-store");
  expect(session.headers()["x-content-type-options"]).toBe("nosniff");
});

test("persistent auth rate limit blocks repeated attempts", async ({ request }, testInfo) => {
  const ip = testInfo.project.name === "mobile" ? "192.0.2.31" : "192.0.2.30";
  let status = 0;
  for (let index = 0; index < 11; index++) {
    const response = await request.post("/api/auth/sign-in/email", { headers: { Origin: "http://127.0.0.1:8787", "cf-connecting-ip": ip }, data: { email: "missing@example.test", password: randomBytes(16).toString("base64url") } });
    status = response.status();
  }
  expect(status).toBe(429);
});
