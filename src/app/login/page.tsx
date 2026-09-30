import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { BrandMark } from "@/components/landing/icons";
export const metadata: Metadata = { title: "Вход — Accountant", robots: { index: false, follow: true } };
export default function LoginPage() {
  return <><SiteHeader /><main className="auth-page shell"><section className="auth-story"><p className="eyebrow muted">РАДЫ ВАС ВИДЕТЬ</p><h1>Всё<br />на своих<br /><span>местах.</span></h1><p>Вернитесь в своё пространство.</p><div className="auth-sculpture" aria-hidden="true"><BrandMark /><span>a.</span></div></section><section className="auth-card" aria-labelledby="login-title"><span className="account-badge">ВАШ АККАУНТ</span><h2 id="login-title">С возвращением</h2><p>Войдите, чтобы продолжить.</p><AuthForm mode="login" /></section></main><SiteFooter /></>;
}
