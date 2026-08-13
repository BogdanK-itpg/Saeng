import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Authentication" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Song Shout
        </Link>
      </header>
      {children}
    </div>
  );
}