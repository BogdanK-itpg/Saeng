import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/current-user";
import { getProfile, getProfileStats } from "@/services/profiles";
import { listRecentShoutActivity } from "@/services/shouts";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileAvatar } from "@/components/friends/profile-avatar";

export const metadata: Metadata = { title: "Profile" };

function Stat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, stats, activity] = await Promise.all([
    getProfile(user.id),
    getProfileStats(user.id),
    listRecentShoutActivity(user.id, { limit: 5 }),
  ]);

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

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Statistics
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={stats.shoutsSent} label="Shouts sent" />
          <Stat value={stats.shoutsReceived} label="Shouts received" />
          <Stat value={stats.friends} label="Friends" />
          <Stat value={stats.reactionsReceived} label="Reactions on your shouts" />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent activity
        </h2>
        {activity.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No shouts yet. Send one to a friend to get things going.
          </p>
        ) : (
          <ul className="space-y-2">
            {activity.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/shouts/${item.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {item.song.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.song.artworkUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.song.title}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {item.direction === "sent" ? "To" : "From"}{" "}
                      {item.other.displayName} · {item.song.artist}
                    </span>
                  </span>
                  <ProfileAvatar
                    avatarUrl={item.other.avatarUrl}
                    displayName={item.other.displayName}
                    size="sm"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

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