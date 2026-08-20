import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
      >
        Skip to content
      </a>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Saeng
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Create account
          </Link>
        </nav>
      </header>

      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center"
      >
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Say it with a song.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Saeng is how friends share what music means to them. Instead of
            writing “this reminded me of you,” pick a friend, pick a song, and
            send a shout.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            I already have an account
          </Link>
        </div>

        <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-3">
          {[
            {
              title: "Make friends",
              body: "Find people by username and build your circle. Only friends can send you shouts.",
            },
            {
              title: "Send a shout",
              body: "Pick a friend, search for a song, and add an optional message. Your song tells the story.",
            },
            {
              title: "Listen & reply",
              body: "Play previews, open tracks in your provider, react with an emoji, or shout one back.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-zinc-200 bg-white p-6 text-left dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
        Saeng stores song references, never audio. Playback and links come
        from your music provider.
      </footer>
    </div>
  );
}