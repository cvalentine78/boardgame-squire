/**
 * Release Notes — What's New in Boardgame Squire
 *
 * ADDING A NEW ENTRY
 * ------------------
 * Max 2 entries per month. Combine related changes into one entry.
 * Add new entries at the top of the correct month's <ol>.
 * If it's a new month, add a new <section> with a <h2> above.
 *
 * Entry format:
 *   - date: ISO 8601 (YYYY-MM-DD) — use the most recent change date for the group
 *   - type badge: ✨ New  |  🐛 Fix  |  ⚡ Performance  |  🔒 Security  |  🎨 Design
 *   - headline: one short sentence, sentence case, no period
 *   - body: 2–3 sentences covering the group of changes
 */

export const metadata = { title: "What's New - Boardgame Squire" }

const badge = {
  new:    'bg-indigo-100 text-indigo-700 border border-indigo-200',
  fix:    'bg-rose-100 text-rose-700 border border-rose-200',
  perf:   'bg-amber-100 text-amber-700 border border-amber-200',
  sec:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  design: 'bg-purple-100 text-purple-700 border border-purple-200',
}

export default function WhatsNewPage() {
  return (
    <div className="pb-10 space-y-2">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">What&apos;s New</h1>
        <p className="text-slate-400 text-sm mt-1">
          Updates to Boardgame Squire, newest first.
        </p>
      </header>

      {/* ─── June 2026 ─────────────────────────────────────── */}
      <section aria-labelledby="month-2026-06">
        <h2 id="month-2026-06" className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 mt-8">
          June 2026
        </h2>
        <ol className="space-y-4 list-none">

          <li>
            <article aria-labelledby="entry-20260605-roundtracker" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-06-05" className="text-xs text-slate-500 font-medium">June 5, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260605-roundtracker" className="text-white font-semibold">Round Tracker with live first-player crown in the score sheet</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A new Round Tracker tool in Game Tools lets you set up your players in seat order, then tap &quot;Start Tracking&quot; to activate it. Once active, a panel appears directly inside any open score sheet showing the current round number, every player in their seat position, and a 👑 crown on whoever goes first this round. Hit &quot;Next Round&quot; from either the score sheet or the Tools page to advance the crown clockwise automatically — no more arguments about whose turn it is to pick a role. Works for any game with a rotating first player, not just Puerto Rico. The dice roller also got a visual upgrade — each die type now renders its actual polygon shape (triangle for d4, diamond for d8, pentagon for d12, and so on) so you can tell them apart at a glance.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260601-bgg" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-06-01" className="text-xs text-slate-500 font-medium">June 1, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260601-bgg" className="text-white font-semibold">Deeper BoardGameGeek integration</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Games imported from BGG now show a thumbnail image, community rating (out of 10), and complexity score with a plain-English label like &quot;Medium-Heavy.&quot; BGG search is also available when editing an existing game - tap Edit, search BGG, and all the details update in one step. A &quot;View on BGG&quot; link on each game&apos;s detail page takes you straight to the rules and files section.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260601-party" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-06-01" className="text-xs text-slate-500 font-medium">June 1, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260601-party" className="text-white font-semibold">Copy shared games to your own library, plus performance improvements</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Party games shared by another member now show a &quot;Copy to My Library&quot; button so you keep access even if you leave the party. Once copied, the shared version is hidden from your list automatically. Under the hood, thumbnails now load as WebP (smaller files), the emoji avatar picker is downloaded only when opened, and BGG search results are cached so repeat lookups return instantly.
              </p>
            </article>
          </li>

        </ol>
      </section>

      {/* ─── May 2026 ─────────────────────────────────────── */}
      <section aria-labelledby="month-2026-05">
        <h2 id="month-2026-05" className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 mt-10">
          May 2026
        </h2>
        <ol className="space-y-4 list-none">

          <li>
            <article aria-labelledby="entry-20260519-realtime" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-19" className="text-xs text-slate-500 font-medium">May 19, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260519-realtime" className="text-white font-semibold">Live match chat, real-time scores, emoji avatars, and multiple parties</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A collapsible chat panel appears on every active session so players can message each other mid-game, and score changes from other devices now appear automatically without refreshing. Every player in your roster can be assigned an emoji avatar chosen from 17 categories, which shows up in the player picker and score sheet. You can also now belong to multiple parties at once, useful for keeping a family group separate from a game-night crew.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260518-launch" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-18" className="text-xs text-slate-500 font-medium">May 18, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260518-launch" className="text-white font-semibold">Boardgame Squire launches with Google Sign-In and party sharing</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Initial release - add your game library, build a player roster, start a match, and keep score round by round with a Who Goes First randomizer and end-game winner declaration. Sign in with Google to sync everything across devices and share with friends via the party system. Several early scoring bugs were fixed in the first days, including concurrent score overwrites and the wrong winner being declared in multi-device sessions.
              </p>
            </article>
          </li>

        </ol>
      </section>
    </div>
  )
}
