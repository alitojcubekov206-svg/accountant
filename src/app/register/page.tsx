import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { BrandMark } from "@/components/landing/icons";
export const metadata: Metadata = { title: "Регистрация — Accountant", robots: { index: false, follow: true } };
export default function RegisterPage() {
  return <><SiteHeader /><main className="auth-page shell"><section className="auth-story"><p className="eyebrow muted">ВАШЕ НОВОЕ ПРОСТРАНСТВО</p><h1>Начните<br />с ясности<span>.</span></h1><p>Создайте аккаунт раннего доступа<br />и познакомьтесь с Accountant.</p><div className="auth-sculpture" aria-hidden="true"><BrandMark /><span>a.</span></div><small>Меньше шума. Больше понимания.</small></section><section className="auth-card" aria-labelledby="register-title"><span className="account-badge">ДОБРО ПОЖАЛОВАТЬ</span><h2 id="register-title">Создать аккаунт</h2><p>Пара минут — и вы на месте.</p><AuthForm mode="register" /></section></main><SiteFooter /></>;
}
