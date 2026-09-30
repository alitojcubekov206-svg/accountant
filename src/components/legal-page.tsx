import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "./site-chrome";
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <><SiteHeader /><main className="legal-page shell"><div className="legal-heading"><p className="eyebrow muted">ПРОЗРАЧНО И ПОНЯТНО</p><h1>{title}</h1><p>{intro}</p><span>Редакция от 30 сентября 2026 года</span></div><article className="legal-content">{children}</article></main><SiteFooter /></>;
}
