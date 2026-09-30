import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://accountant.tojcubekovali98.chatgpt.site"),
  title: "Accountant — финансы в новом измерении",
  description: "Публичная концепция ИИ-бухгалтера: интерактивная 3D-сцена и понятная демонстрация финансов бизнеса.",
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
  openGraph: { title: "Accountant — ясность в каждой цифре", description: "Посмотрите на бизнес под новым углом. Интерактивная 3D-концепция ИИ-бухгалтера.", locale: "ru_RU", type: "website" },
};
export const viewport: Viewport = { themeColor: "#f5f5ef" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
