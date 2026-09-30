"use client";
import { useState, type FormEvent } from "react";
import { authRequest } from "@/lib/auth-client";
import { Icon } from "./landing/icons";

export function AuthForm({ mode }: { mode: "register" | "login" }) {
  const register = mode === "register";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(""); setPending(true);
    try {
      await authRequest(register ? "sign-up/email" : "sign-in/email", {
        email: String(data.get("email")), password: String(data.get("password")),
        ...(register ? { name: String(data.get("name")), legalAccepted: data.get("legal") === "on", termsVersion: "2026-09-30" } : {}),
      });
      window.location.assign("/account/");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Нет соединения с сервером. Попробуйте снова."); setPending(false); }
  }
  return <form className="auth-form" onSubmit={submit}>
    {register && <label>Как к вам обращаться<input name="name" autoComplete="name" placeholder="Ваше имя" required minLength={2} maxLength={60} disabled={pending} /></label>}
    <label>Email<input type="email" name="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={pending} /></label>
    <label>Пароль<span className="password-field"><input aria-label="Пароль" type={showPassword ? "text" : "password"} name="password" autoComplete={register ? "new-password" : "current-password"} placeholder={register ? "Минимум 12 символов" : "Ваш пароль"} required minLength={register ? 12 : undefined} maxLength={128} disabled={pending} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? "Скрыть" : "Показать"}</button></span></label>
    {register && <label className="consent"><input name="legal" type="checkbox" required disabled={pending} /><span>Я принимаю <a href="/terms/" target="_blank" rel="noreferrer">условия использования</a> и ознакомился с <a href="/privacy/" target="_blank" rel="noreferrer">политикой конфиденциальности</a>.</span></label>}
    {error && <p className="form-message error" role="alert">{error}</p>}
    <button className="button button-dark submit-button" disabled={pending}>{pending ? "Подождите…" : register ? "Создать аккаунт" : "Войти"}<Icon name="arrow" /></button>
    <p className="auth-alternate">{register ? "Уже есть аккаунт?" : "Первый раз здесь?"} <a href={register ? "/login/" : "/register/"}>{register ? "Войти" : "Зарегистрироваться"}</a></p>
    <p className="form-note">{register ? "Аккаунт раннего доступа — бесплатно. Финансовое приложение ещё развивается. Не загружайте конфиденциальные документы." : "Вход по email и паролю. Восстановление пароля по почте пока недоступно — сохраните пароль в менеджере паролей."}</p>
  </form>;
}
