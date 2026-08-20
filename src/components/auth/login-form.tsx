"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, { error: "" });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {state.error && <Alert>{state.error}</Alert>}

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="e.g. alex_baumann"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {/* Email-driven password reset disabled for future development. */}
      {/*
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Forgot password?
        </Link>
      </div>
      */}

      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link
          href="/register"
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}