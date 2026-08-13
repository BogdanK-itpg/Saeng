"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

/** Username search that live-updates the `q` URL param. */
export function FriendSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (value === initialQuery) return;
    clearTimeout(timer.current ?? undefined);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.replace(`/friends?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer.current ?? undefined);
  }, [value, initialQuery, router, searchParams]);

  return (
    <div className="space-y-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by username…"
        autoComplete="off"
        spellCheck={false}
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Find a friend by their username to send a request.
      </p>
    </div>
  );
}