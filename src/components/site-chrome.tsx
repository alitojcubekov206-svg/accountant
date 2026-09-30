import { BrandMark } from "./landing/icons";

export function SiteHeader() {
  return <header className="site-header shell"><a className="brand" href="/" aria-label="Accountant — на главную"><span className="brand-mark"><BrandMark /></span><span>accountant<span className="brand-dot">.</span></span><span className="brand-ai">AI</span></a><nav className="simple-nav" aria-label="Навигация"><a href="/#demo">Демо</a><a href="/login/">Войти</a><a className="button button-dark" href="/register/">Создать аккаунт</a></nav></header>;
}
export function SiteFooter() {
  return <footer className="site-footer shell"><a className="brand" href="/" aria-label="Accountant — на главную"><span className="brand-mark"><BrandMark /></span><span>accountant<span className="brand-dot">.</span></span></a><nav className="footer-links" aria-label="Правовая информация"><a href="/terms/">Условия</a><a href="/privacy/">Конфиденциальность</a><a href="/contact/">Контакты</a><a href="https://github.com/alitojcubekov206-svg/accountant" target="_blank" rel="noreferrer">GitHub ↗</a></nav><span>© 2026 Accountant</span></footer>;
}
