/**
 * Release Notes — What's New in Boardgame Squire
 *
 * ADDING A NEW ENTRY
 * ------------------
 * Copy the <article> block below and add it at the top of the correct <section>.
 * If it's the first entry in a new month, add a new <section> with a <h2> header above.
 *
 * Entry format:
 *   - date: ISO 8601 (YYYY-MM-DD)
 *   - type badge: one of ✨ New  |  🐛 Fix  |  ⚡ Performance  |  🔒 Security  |  🎨 Design
 *   - headline: one short sentence, sentence case, no period
 *   - body: 2–3 sentences. What changed, why it matters, anything the user needs to do.
 *
 * Example:
 *   <article aria-labelledby="entry-YYYYMMDD">
 *     <header>
 *       <time dateTime="YYYY-MM-DD">Month D, YYYY</time>
 *       <span className={badge.new}>✨ New</span>
 *     </header>
 *     <h3 id="entry-YYYYMMDD">Short headline here</h3>
 *     <p>2–3 sentences of detail.</p>
 *   </article>
 */

export const metadata = { title: 'What\'s New — Boardgame Squire' }

const badge = {
  new:  'bg-indigo-100 text-indigo-700 border border-indigo-200',
  fix:  'bg-rose-100 text-rose-700 border border-rose-200',
  perf: 'bg-amber-100 text-amber-700 border border-amber-200',
  sec:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
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

      {/* ─── June 2026 ─────────────────────────────────────────── */}
      <section aria-labelledby="month-2026-06">
        <h2 id="month-2026-06" className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 mt-8">
          June 2026
        </h2>

        <ol className="space-y-4 list-none">

          <li>
            <article aria-labelledby="entry-20260601-perf" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-06-01" className="text-xs text-slate-500 font-medium">June 1, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.perf}`}>⚡ Performance</span>
              </header>
              <h3 id="entry-20260601-perf" className="text-white font-semibold">Faster load times across the app</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Game thumbnails now load as WebP (roughly 30% smaller than JPEG) and off-screen images are lazy-loaded so they don&apos;t block the initial paint. The avatar emoji picker is no longer bundled into the Players page — it only downloads the first time you open the picker, cutting that page&apos;s JavaScript by about 40%. BGG game data is now cached at the CDN for up to 24 hours, so repeat searches return instantly.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260601-bgg2" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-06-01" className="text-xs text-slate-500 font-medium">June 1, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260601-bgg2" className="text-white font-semibold">BGG rating and complexity shown on every game</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                When you import a game from BoardGameGeek, its community rating (out of 10) and complexity weight (out of 5) are saved and displayed — both on the game card in your library and on the detail page with a plain-English label like &quot;Medium-Heavy.&quot; Game thumbnails from BGG also now appear in the list and on the detail page. To add these to an existing game, open Edit Game, search BGG, select your game, and save.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260601-bgg1" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-06-01" className="text-xs text-slate-500 font-medium">June 1, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260601-bgg1" className="text-white font-semibold">BGG search now available when editing an existing game</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The Edit Game page now has a full BoardGameGeek search at the top of step 1, identical to the Add Game flow. Pick your game from BGG and the name, description, player count, and thumbnail all update in one tap. A &quot;View on BGG&quot; link takes you straight to the game&apos;s page so you can grab rules PDFs from the Files tab.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260601-save" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-06-01" className="text-xs text-slate-500 font-medium">June 1, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260601-save" className="text-white font-semibold">Save a game without building a score sheet</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Both the Add Game and Edit Game pages now show a green &quot;Save Game&quot; button on step 1 alongside the &quot;Score Sheet&quot; button. If you&apos;re importing from BGG just to update details, or adding a game that uses a simple round-by-round grid, you can save and be done in one step. The score sheet step is now optional, not required.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260601-copy" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-06-01" className="text-xs text-slate-500 font-medium">June 1, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260601-copy" className="text-white font-semibold">Copy a shared party game to your own library</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Games shared by another party member now show a &quot;📋 Copy&quot; button. Tapping it creates an independent copy in your account so you keep access even if you leave the party. Once copied, the party&apos;s version is hidden from your list and a &quot;✓ In your library&quot; badge appears in its place so you aren&apos;t prompted to copy it twice.
              </p>
            </article>
          </li>

        </ol>
      </section>

      {/* ─── May 2026 ─────────────────────────────────────────── */}
      <section aria-labelledby="month-2026-05">
        <h2 id="month-2026-05" className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 mt-10">
          May 2026
        </h2>

        <ol className="space-y-4 list-none">

          <li>
            <article aria-labelledby="entry-20260519-chat" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-19" className="text-xs text-slate-500 font-medium">May 19, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260519-chat" className="text-white font-semibold">Live match chat and real-time score updates</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A collapsible &quot;Match Chat&quot; panel now appears at the bottom of every active session. Messages appear instantly for everyone viewing the match — no refresh needed. Score changes from other players&apos; devices also update live: if Kristy enters a score on her phone, you see it on yours within a second or two. A blue &quot;new&quot; badge on the chat header counts unread messages while it&apos;s collapsed.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260519-avatars" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-19" className="text-xs text-slate-500 font-medium">May 19, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260519-avatars" className="text-white font-semibold">Emoji avatars for players, with 17 category tabs</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every player in your roster can now have an emoji avatar — hearts, animals, sports, fantasy creatures, food, and more across 17 scrollable categories. Tap the avatar circle in the Players list to change it at any time. Avatars show up in the session player picker and anywhere else players are listed.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260519-parties" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-19" className="text-xs text-slate-500 font-medium">May 19, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260519-parties" className="text-white font-semibold">Multiple parties and per-game sharing control</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                You can now be in more than one party at a time — useful for keeping a family group separate from a game-night crew. Each party can be assigned a specific game, and the Stats page gains a party filter that narrows the leaderboard to only that game. Each game in your library also has a 🔒/🌐 toggle so you control which games your party can see.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260518-scoring" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-18" className="text-xs text-slate-500 font-medium">May 18, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.fix}`}>🐛 Fix</span>
              </header>
              <h3 id="entry-20260518-scoring" className="text-white font-semibold">Concurrent scoring no longer overwrites other players&apos; scores</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                When two players entered scores at the same time, the second save would erase the first. Scoring now saves one cell at a time using an upsert (update-or-insert) strategy, so each player&apos;s score is independent. A full-page save no longer deletes everything and rewrites it — it only touches cells that actually changed.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260518-firstplayer" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-18" className="text-xs text-slate-500 font-medium">May 18, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.fix}`}>🐛 Fix</span>
              </header>
              <h3 id="entry-20260518-firstplayer" className="text-white font-semibold">Who Goes First is consistent across all devices</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The first player used to be chosen per-device and stored locally, so opening a session on a second phone would re-randomize it. The result is now stored in the database the moment it&apos;s picked, so every device that loads the session sees the same person. Re-rolls are also saved immediately so everyone stays in sync.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260518-winner" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-18" className="text-xs text-slate-500 font-medium">May 18, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.fix}`}>🐛 Fix</span>
              </header>
              <h3 id="entry-20260518-winner" className="text-white font-semibold">End Game now declares the correct winner</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                In multi-device sessions, clicking &quot;End Game&quot; could declare the wrong winner if one player&apos;s screen had stale scores. The app now re-fetches the latest scores from the database immediately before calculating totals, so the winner is always based on the true final state of the scorecard.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260518-party" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-18" className="text-xs text-slate-500 font-medium">May 18, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260518-party" className="text-white font-semibold">Party system — share games and sessions with friends</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Create a party and invite friends with a 6-character code. Once they join, you share a game library, player roster, and match history. Any party member can start a session, enter scores, and see results — all in real time. Leaving a party does not delete any match history; only future visibility is affected.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260518-auth" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-18" className="text-xs text-slate-500 font-medium">May 18, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260518-auth" className="text-white font-semibold">Google Sign-In — your data follows you everywhere</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sign in with any Google account to sync your games, players, and match history across devices. Before sign-in, data was local to your browser; after signing in, everything is stored securely in the cloud. Row-level security ensures only you (and your party members) can access your data.
              </p>
            </article>
          </li>

          <li>
            <article aria-labelledby="entry-20260518-launch" className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <header className="flex items-center gap-3 flex-wrap">
                <time dateTime="2026-05-18" className="text-xs text-slate-500 font-medium">May 18, 2026</time>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.new}`}>✨ New</span>
              </header>
              <h3 id="entry-20260518-launch" className="text-white font-semibold">Boardgame Squire launches</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Initial release of Boardgame Squire — a mobile-first companion app for tracking board game sessions, scores, and stats. Add your game library, build a player roster, start a match, and keep score round by round. Who Goes First randomizer, match history, and a stats leaderboard included from day one.
              </p>
            </article>
          </li>

        </ol>
      </section>

      {/* ─── Format guide (only visible in source) ─── */}
    </div>
  )
}
