import { createAuth, legalVersion, type SiteEnv } from "./auth";

const endpoints = new Map([
  ["/api/auth/sign-up/email", "POST"], ["/api/auth/sign-in/email", "POST"],
  ["/api/auth/sign-out", "POST"], ["/api/auth/get-session", "GET"],
  ["/api/auth/change-password", "POST"], ["/api/auth/delete-user", "POST"],
]);

function jsonError(message: string, status: number) {
  return Response.json({ message }, { status });
}

async function authRequest(request: Request, env: SiteEnv, path: string) {
  let raw = "";
  if (request.method === "POST") {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    let oversized = Number(request.headers.get("content-length")) > 8192;
    if (reader) for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) oversized = true;
      if (!oversized) chunks.push(value);
      // Drain rejected bodies without retaining them. Unread/cancelled input can
      // abort a keep-alive transport before a subsequent response is delivered.
    }
    if (oversized) return jsonError("Запрос слишком большой.", 413);
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    raw = new TextDecoder().decode(bytes);
  }
  if (endpoints.get(path) !== request.method) return jsonError("Маршрут недоступен.", 404);
  if (!env.DB || !env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32 || !env.SITE_URL) {
    return jsonError("Регистрация временно недоступна. Попробуйте позже.", 503);
  }
  if (request.method === "POST") {
    if (request.headers.get("origin") !== env.SITE_URL) return jsonError("Недопустимый источник запроса.", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return jsonError("Ожидается JSON.", 415);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return jsonError("Некорректный запрос.", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Некорректный запрос.", 400);
    const fields = body as Record<string, unknown>;
    request = new Request(request, { body: raw });
    if (path === "/api/auth/sign-up/email") {
      if (fields.legalAccepted !== true || fields.termsVersion !== legalVersion) return jsonError("Примите актуальные условия использования.", 400);
      if (typeof fields.name !== "string" || fields.name.trim().length < 2 || fields.name.trim().length > 60) return jsonError("Имя должно содержать от 2 до 60 символов.", 400);
      if (typeof fields.email !== "string" || fields.email.length > 254) return jsonError("Проверьте email.", 400);
      if (typeof fields.password !== "string" || fields.password.length < 12 || fields.password.length > 128) return jsonError("Пароль должен содержать от 12 до 128 символов.", 400);
      // Only these inputs can reach identity creation; consent metadata is server controlled.
      request = new Request(request, { body: JSON.stringify({ name: fields.name.trim(), email: fields.email.trim().toLowerCase(), password: fields.password }) });
    } else if (path === "/api/auth/delete-user") {
      if (typeof fields.password !== "string") return jsonError("Подтвердите удаление паролем.", 400);
      request = new Request(request, { body: JSON.stringify({ password: fields.password }) });
    }
  }
  const auth = createAuth(env);
  if (path === "/api/auth/get-session") {
    const result = await auth.api.getSession({ headers: request.headers });
    // Never return bearer session tokens or infrastructure details to the browser.
    return Response.json(result ? { user: { name: result.user.name, email: result.user.email, createdAt: result.user.createdAt } } : null);
  }
  const response = await auth.handler(request);
  // Cookie-based browser clients do not need the tokens returned by auth endpoints.
  if (response.ok) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(JSON.stringify({ success: true }), { status: response.status, headers });
  }
  return response;
}

export default {
  async fetch(request: Request, env: SiteEnv): Promise<Response> {
    const url = new URL(request.url);
    let response: Response;
    try {
      if (url.pathname === "/api/health") response = Response.json({ status: "ok", service: "accountant" });
      else if (url.pathname.startsWith("/api/auth/")) response = await authRequest(request, env, url.pathname);
      else if (url.pathname.startsWith("/api/")) response = jsonError("Маршрут не найден.", 404);
      else if (url.pathname === "/account" || url.pathname.startsWith("/account/")) {
        if (!env.DB || !env.BETTER_AUTH_SECRET) response = jsonError("Сервис временно недоступен.", 503);
        else if (!await createAuth(env).api.getSession({ headers: request.headers })) response = Response.redirect(new URL("/login/", request.url).href, 302);
        else response = await env.ASSETS.fetch(new Request(new URL("/account/index.html", request.url), request));
      } else {
        // Next's static export produces /route/index.html. Do not serve an SPA for unknown URLs.
        const assetUrl = new URL(request.url);
        if (!assetUrl.pathname.split("/").pop()?.includes(".")) assetUrl.pathname = assetUrl.pathname.replace(/\/$/, "") + "/index.html";
        response = await env.ASSETS.fetch(new Request(assetUrl, request));
        if (response.status === 404) {
          const missing = await env.ASSETS.fetch(new Request(new URL("/404.html", request.url), request));
          response = new Response(missing.body, { status: 404, headers: missing.headers });
        }
      }
    } catch {
      // The category is safe to log; request bodies, headers and auth errors can contain secrets.
      console.error("accountant_request_failed");
      response = jsonError("Не удалось выполнить запрос. Попробуйте позже.", 500);
    }
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
    if (url.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000");
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/account")) headers.set("Cache-Control", "private, no-store");
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<SiteEnv>;
