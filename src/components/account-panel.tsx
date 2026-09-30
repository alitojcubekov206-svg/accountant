"use client";
import { useEffect, useState, type FormEvent } from "react";
import { authRequest, getCurrentUser, type SiteUser } from "@/lib/auth-client";
import { BrandMark, Icon } from "./landing/icons";

export function AccountPanel() {
  const [user, setUser] = useState<SiteUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then(result => {
      if (cancelled) return;
      if (!result) { window.location.replace("/login/"); return; }
      setUser(result); setLoading(false);
    }).catch(() => { if (!cancelled) { setError("Не удалось проверить вход. Обновите страницу."); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);
  async function logout() {
    setPending(true); setError("");
    try { await authRequest("sign-out", {}); window.location.assign("/login/"); }
    catch { setError("Не удалось выйти. Попробуйте снова."); setPending(false); }
  }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    setPending(true); setError(""); setMessage("");
    try { await authRequest("change-password", { currentPassword: String(data.get("current")), newPassword: String(data.get("new")), revokeOtherSessions: true }); form.reset(); setMessage("Пароль изменён. Другие сессии завершены."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось изменить пароль."); }
    finally { setPending(false); }
  }
  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    setPending(true); setError("");
    try { await authRequest("delete-user", { password: String(data.get("password")) }); window.location.assign("/login/?deleted=1"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось удалить аккаунт."); setPending(false); }
  }
  if (loading) return <div className="account-loading" role="status">Проверяем вход…</div>;
  if (!user) return <div className="account-loading"><p role="alert">{error}</p><a className="button button-dark" href="/login/">Перейти ко входу</a></div>;
  return <div className="account-content"><div className="account-heading"><div><p className="eyebrow muted"><span className="status-dot" /> ЛИЧНОЕ ПРОСТРАНСТВО</p><h1>Добро пожаловать,<br /><span>{user.name}.</span></h1><p>{user.email}</p></div><button className="button button-outline" disabled={pending} onClick={logout}>Выйти <Icon name="arrow" /></button></div>
    <section className="welcome-card"><span className="welcome-brand"><BrandMark /></span><div><span className="account-badge">РАННИЙ ДОСТУП</span><h2>Начало новой ясности.</h2><p>Ваш аккаунт создан и сохранён. Здесь будет рабочее пространство для финансов бизнеса. Сейчас вы можете изучить демонстрацию и управлять своим аккаунтом.</p><a href="/#demo" className="button button-dark">Открыть демонстрацию <Icon name="arrow" /></a></div></section>
    <div className="account-roadmap"><article><span>01 · СЕЙЧАС</span><h3>Знакомство</h3><p>Публичный сайт, 3D-демо и ваш аккаунт.</p></article><article><span>02 · В РАЗРАБОТКЕ</span><h3>Учёт бизнеса</h3><p>Доходы, расходы, заказы и права команды.</p></article><article><span>03 · ПОЗЖЕ</span><h3>ИИ-помощник</h3><p>Объяснения на основе проверенных показателей.</p></article></div>
    {error && <p className="form-message error" role="alert">{error}</p>}{message && <p className="form-message success" role="status">{message}</p>}
    <section className="account-settings"><h2>Настройки аккаунта</h2><div className="settings-grid"><form className="auth-form settings-card" onSubmit={changePassword}><h3>Изменить пароль</h3><label>Текущий пароль<input name="current" type="password" autoComplete="current-password" required disabled={pending} /></label><label>Новый пароль<input name="new" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={pending} /></label><button className="button button-dark" disabled={pending}>Сохранить пароль</button></form><form className="auth-form settings-card" onSubmit={deleteAccount}><h3>Удалить аккаунт</h3><p>Профиль, пароль и активные сессии будут удалены. Действие нельзя отменить.</p><label>Подтвердите паролем<input name="password" type="password" autoComplete="current-password" required disabled={pending} /></label><label className="consent"><input type="checkbox" required disabled={pending} /><span>Я понимаю, что мой аккаунт будет удалён.</span></label><button className="button button-danger" disabled={pending}>Удалить мой аккаунт</button></form></div></section>
  </div>;
}
