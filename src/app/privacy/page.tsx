import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - Boardgame Squire',
  description: 'How Boardgame Squire collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-5 py-12 space-y-8">

        <header className="space-y-2">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">← Back to app</Link>
          <h1 className="text-3xl font-bold text-white mt-4">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Boardgame Squire · Last updated June 3, 2025</p>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <p className="text-slate-300 leading-relaxed">
            Boardgame Squire is a personal board game companion app. We take your privacy seriously
            and keep things simple: we collect only what&apos;s needed to run the app, we don&apos;t
            sell your data, and we don&apos;t use it for advertising.
          </p>
        </section>

        <div className="space-y-6">

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">What we collect</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <p className="font-medium text-white">Account information</p>
                <p>When you sign in with Google, we receive your name and email address from Google.
                  We use these to identify your account and display your name in the app.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <p className="font-medium text-white">App data you create</p>
                <p>Games you add, players you create, match sessions, scores, and chat messages are
                  stored so the app works as intended. This data is yours.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <p className="font-medium text-white">Usage data</p>
                <p>We do not use analytics tools or track how you use the app beyond what&apos;s
                  necessary to deliver its features.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">How we use your data</h2>
            <ul className="text-slate-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>To authenticate you and keep your account secure</li>
              <li>To store and display your game library, players, and match history</li>
              <li>To enable party features like sharing games and viewing leaderboards with friends</li>
              <li>To show your name in match chat and session results</li>
            </ul>
            <p className="text-slate-300 text-sm leading-relaxed">
              We do not sell, rent, or share your personal information with third parties for
              marketing or advertising purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Data storage</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your data is stored securely using{' '}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline">Supabase</a>,
              a managed database platform hosted on AWS in the US East region. Supabase
              applies encryption at rest and in transit. You can review their security
              practices at{' '}
              <a href="https://supabase.com/security" target="_blank" rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline">supabase.com/security</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Third-party services</h2>
            <div className="space-y-2 text-slate-300 text-sm leading-relaxed">
              <p><span className="text-white font-medium">Google OAuth</span> — used for sign-in.
                Google&apos;s privacy policy applies to the authentication process:
                {' '}<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline">policies.google.com/privacy</a>.
              </p>
              <p><span className="text-white font-medium">BoardGameGeek</span> — used to look up
                game information (name, description, artwork) when you add games. No personal data
                is sent to BoardGameGeek.</p>
              <p><span className="text-white font-medium">Vercel</span> — used to host the app.
                Vercel may log standard web request metadata (IP address, user agent) for
                security and performance purposes.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Your rights</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              You can delete your account and associated data at any time by contacting us. You can
              also delete individual games, players, and sessions directly within the app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Children</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Boardgame Squire is not directed at children under 13. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Changes to this policy</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              If we make material changes to this policy, we&apos;ll update the date at the top of
              this page. Continued use of the app after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Questions about this policy? Email us at{' '}
              <a href="mailto:cari.valentine1978@gmail.com"
                className="text-indigo-400 hover:text-indigo-300 underline">
                cari.valentine1978@gmail.com
              </a>.
            </p>
          </section>

        </div>

        <footer className="pt-4 border-t border-white/10 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Boardgame Squire · <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Back to app</Link>
        </footer>

      </div>
    </div>
  )
}
