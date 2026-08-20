"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, { error: "" });

  return (
    <form action={action} className="space-y-4">
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
        <p className="text-xs text-zinc-500">
          Lowercase letters, numbers, underscores. 3–20 characters.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="e.g. Alex"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-zinc-500">At least 8 characters.</p>
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}