import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Authentication" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
      >
        Skip to content
      </a>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Song Shout
        </Link>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}