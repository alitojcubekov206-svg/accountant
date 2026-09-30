import type { SVGProps, ReactNode } from "react";

type IconName = "arrow" | "spark" | "chart" | "wallet" | "shield" | "layers" | "play" | "pause" | "reset" | "menu" | "close" | "check";

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z" /></>,
    chart: <><path d="M4 4v16h16M8 15v-4M13 15V7M18 15v-7" /></>,
    wallet: <><path d="M19 7V5H5a2 2 0 0 0 0 4h15v11H5a2 2 0 0 1-2-2V7" /><path d="M20 12h-5v4h5" /><path d="M16.5 14h.01" /></>,
    shield: <><path d="m12 3 8 3v6c0 4-5 7-8 9-3-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" /></>,
    play: <path d="m9 5 11 7-11 7V5Z" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    reset: <><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M6 18 18 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export function BrandMark() {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m20 5 13 7.5v15L20 35 7 27.5v-15L20 5Z" stroke="currentColor" strokeWidth="2" /><path d="m7 12.5 13 8 13-8M20 20.5V35M13.5 8.8l13 7.7v7.7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>;
}
