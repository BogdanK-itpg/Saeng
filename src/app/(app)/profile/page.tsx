import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/current-user";
import { getProfile } from "@/services/profiles";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  if (!profile) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Profile not found. Please contact support.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profile
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          How other people see you.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Avatar
        </h2>
        <AvatarUpload userId={user.id} avatarUrl={profile.avatarUrl} />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Account details
        </h2>
        <ProfileForm
          initialUsername={profile.username}
          initialDisplayName={profile.displayName}
        />
      </section>

      {/* Email display disabled for future development — auth is username-based. */}
      {/*
      <section className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Contact email
        </h2>
        <p className="mt-1">{user.email}</p>
      </section>
      */}
    </div>
  );
}