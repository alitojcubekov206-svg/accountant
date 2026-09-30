export interface SiteUser { name: string; email: string; createdAt: string }

export async function authRequest(path: string, body?: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error("Слишком много попыток. Подождите минуту и попробуйте снова.");
    if (response.status >= 500) throw new Error("Сервис временно недоступен. Попробуйте позже.");
    if (path === "sign-in/email") throw new Error("Не удалось войти. Проверьте email и пароль.");
    if (path === "sign-up/email") throw new Error("Не удалось создать аккаунт. Проверьте данные или войдите, если уже регистрировались.");
    throw new Error("Не удалось выполнить действие. Проверьте пароль и попробуйте снова.");
  }
  return response.json();
}

export async function getCurrentUser(): Promise<SiteUser | null> {
  const data = await authRequest("get-session");
  if (data === null) return null;
  if (typeof data !== "object" || !data || !("user" in data)) throw new Error("Не удалось проверить аккаунт.");
  const user = data.user;
  if (typeof user !== "object" || !user || !("name" in user) || !("email" in user) || !("createdAt" in user) || typeof user.name !== "string" || typeof user.email !== "string" || typeof user.createdAt !== "string") throw new Error("Не удалось проверить аккаунт.");
  return { name: user.name, email: user.email, createdAt: user.createdAt };
}
