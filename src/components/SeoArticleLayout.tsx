import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface SeoArticleLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function SeoArticleLayout({ eyebrow, title, description, children }: SeoArticleLayoutProps) {
  return (
    <div className="min-h-dvh bg-[#f5f6f8] text-[#202124] dark:bg-[#121212] dark:text-[#e8eaed]">
      <header className="sticky top-0 z-20 border-b border-[#dadce0]/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-[#2d3135] dark:bg-[#181a1b]/90 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 rounded-xl font-extrabold">
            <img src="/favicon.png" alt="" className="h-9 w-9 rounded-xl" />
            <span>ArabiMalayalam</span>
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-xl bg-[#137333] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f5f2a] active:scale-95"
          >
            Open keyboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <article className="rounded-3xl border border-[#e1e5e2] bg-white p-6 shadow-sm dark:border-[#2d3135] dark:bg-[#1e1e1e] sm:p-10">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.16em] text-[#137333] dark:text-[#a3e635]">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-[#5f6368] dark:text-[#bdc1c6] sm:text-lg">
            {description}
          </p>
          <div className="seo-article mt-10">{children}</div>
        </article>
      </main>
    </div>
  );
}
