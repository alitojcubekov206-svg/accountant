import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
export const metadata: Metadata = { title: "Мой аккаунт — Accountant", robots: { index: false, follow: false } };
export default function AccountPage() { return <><SiteHeader /><main className="account-page shell"><AccountPanel /></main><SiteFooter /></>; }
