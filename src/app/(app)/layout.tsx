import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { countUnreadNotifications } from "@/services/notifications";
import { NavLink } from "@/components/layout/nav-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { NotificationsNavLink } from "@/components/notifications/notifications-nav-link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/friends", label: "Friends" },
  { href: "/send", label: "Send Shout" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const unreadNotifications = await countUnreadNotifications(user.id);

  const profileName =
    profile?.display_name ?? (user.user_metadata?.username as string | undefined) ?? "Account";

  const navItems = NAV_ITEMS.map((item) =>
    item.href === "/notifications" ? (
      <NotificationsNavLink
        key={item.href}
        userId={user.id}
        unreadCount={unreadNotifications}
      />
    ) : (
      <NavLink key={item.href} href={item.href}>
        {item.label}
      </NavLink>
    ),
  );

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Song Shout
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">{navItems}</nav>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              aria-label={`Your profile (${profileName})`}
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile?.avatar_url ?? "/avatar-placeholder.svg"}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
              />
              <span className="hidden sm:inline">{profileName}</span>
            </Link>
            <div className="hidden sm:block">
              <SignOutButton />
            </div>
            <MobileNav>
              {navItems}
              <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <Link
                  href="/profile"
                  aria-label={`Your profile (${profileName})`}
                  className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile?.avatar_url ?? "/avatar-placeholder.svg"}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                  />
                  <span className="truncate">{profileName}</span>
                </Link>
                <SignOutButton />
              </div>
            </MobileNav>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <SettingsProvider>{children}</SettingsProvider>
      </main>
    </div>
  );
}