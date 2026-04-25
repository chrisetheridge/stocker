export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm tracking-[0.3em] text-sky-300 uppercase">
            Stocker
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Local-first intelligence inbox for articles and stocks
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Stocker collects RSS/Atom and Reddit feed items, enriches them with
            company and market context, and surfaces the items worth reading or
            saving for research.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-lg font-medium text-white">Run the app</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <code className="rounded bg-white/10 px-2 py-1">
                  pnpm --filter @stocker/web dev
                </code>
              </li>
              <li>
                <code className="rounded bg-white/10 px-2 py-1">
                  pnpm --filter @stocker/worker dev
                </code>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-lg font-medium text-white">Current scope</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Monorepo foundation with shared packages</li>
              <li>Next.js web client and separate worker process</li>
              <li>Reusable service core for later CLI and TUI clients</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
