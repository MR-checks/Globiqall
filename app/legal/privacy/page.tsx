import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What GlobiQall collects, why, and your rights.",
};

const LAST_UPDATED = "2026-06-01";

export default function PrivacyPage() {
  return (
    <article>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
        Legal · Privacy
      </div>
      <h1 className="text-[32px] sm:text-[44px] leading-[1.05] font-medium tracking-tightest text-balance">
        Privacy policy.
      </h1>
      <p className="text-muted-foreground mt-2 text-[13px] font-mono uppercase tracking-[0.08em]">
        Last updated · {LAST_UPDATED}
      </p>
      <p className="mt-5 text-[15px] leading-relaxed text-foreground/90 text-pretty">
        We collect the minimum we need to run a global polling site, and we never
        sell your data. This page is the straight version — no dark patterns,
        no buried exceptions.
      </p>

      <Section title="Who runs this">
        <P>
          GlobiQall is operated by its founders. You can reach us at{" "}
          <a className="underline decoration-accent underline-offset-4" href="mailto:privacy@globiqall.com">
            privacy@globiqall.com
          </a>
          .
        </P>
      </Section>

      <Section title="What we collect">
        <ul className="space-y-2 text-[14px] text-foreground/85">
          <Bullet>
            <strong>Account data</strong> — email (required), display name, username, optional bio and avatar URL. Collected when you sign up via email magic link or OAuth (Google, Apple, GitHub).
          </Bullet>
          <Bullet>
            <strong>Activity</strong> — the polls you create, the votes you cast, the comments you post. Your individual votes are stored alongside your account so we can show you what you picked and prevent ballot stuffing.
          </Bullet>
          <Bullet>
            <strong>Coarse location</strong> — a two-letter country code, derived from your IP via edge headers (Vercel/Cloudflare). We never store your raw IP after deriving the country. Used to power the global breakdown on each poll.
          </Bullet>
          <Bullet>
            <strong>Reputation + streak counters</strong> — derived numbers (reputation score, streak days, badges) computed from your activity. Public on your profile.
          </Bullet>
          <Bullet>
            <strong>Error reports</strong> — when the app crashes for you, we send a stack trace and the URL to{" "}
            <a className="underline decoration-accent underline-offset-4" href="https://sentry.io" target="_blank" rel="noopener noreferrer">Sentry</a>
            . We do not attach your user ID or email. Personal data is scrubbed before sending.
          </Bullet>
          <Bullet>
            <strong>Product analytics (optional)</strong> — if you opt in to analytics in the cookie banner, we send anonymous event data (page views, votes cast) to{" "}
            <a className="underline decoration-accent underline-offset-4" href="https://posthog.com" target="_blank" rel="noopener noreferrer">PostHog</a>
            . You can opt out at any time and we'll stop immediately.
          </Bullet>
        </ul>
      </Section>

      <Section title="What we do NOT collect">
        <ul className="space-y-2 text-[14px] text-foreground/85">
          <Bullet>We do not sell or rent your data to anyone.</Bullet>
          <Bullet>We do not run ad-network trackers (no Facebook pixel, no Google ads pixel, no third-party retargeting).</Bullet>
          <Bullet>We do not store your raw IP address or precise location after the country lookup.</Bullet>
          <Bullet>We do not read your votes for marketing purposes.</Bullet>
        </ul>
      </Section>

      <Section title="Why we collect what we collect">
        <ul className="space-y-2 text-[14px] text-foreground/85">
          <Bullet><strong>Email</strong> — to authenticate you, send sign-in links, and reach you about account-critical issues (security, deletion, ToS changes). Never marketing without explicit opt-in.</Bullet>
          <Bullet><strong>Votes + polls + comments</strong> — to operate the service. This is the product.</Bullet>
          <Bullet><strong>Country</strong> — to compute the global breakdown on poll pages. Aggregate counts only — your individual country is not shown next to your username.</Bullet>
          <Bullet><strong>Errors + analytics</strong> — to keep the site working and to understand which features earn their place.</Bullet>
        </ul>
      </Section>

      <Section title="Your rights">
        <P>You can, at any time:</P>
        <ul className="mt-3 space-y-2 text-[14px] text-foreground/85">
          <Bullet>
            <strong>Access + export</strong> a JSON snapshot of all your data via{" "}
            <a className="underline decoration-accent underline-offset-4" href="/settings/account">/settings/account → Export</a>
            .
          </Bullet>
          <Bullet>
            <strong>Delete your account</strong> instantly via{" "}
            <a className="underline decoration-accent underline-offset-4" href="/settings/account">/settings/account → Delete</a>
            . This wipes your profile, polls (including all votes/comments on them), and your own votes and comments. Aggregate vote counters update accordingly.
          </Bullet>
          <Bullet>
            <strong>Edit</strong> your name, username, and bio at{" "}
            <a className="underline decoration-accent underline-offset-4" href="/settings/profile">/settings/profile</a>
            .
          </Bullet>
          <Bullet>
            <strong>Opt out of analytics</strong> via the cookie banner or browser settings. Essential session cookies cannot be disabled — they keep you signed in.
          </Bullet>
          <Bullet>
            <strong>Contact us</strong> with any privacy question at{" "}
            <a className="underline decoration-accent underline-offset-4" href="mailto:privacy@globiqall.com">privacy@globiqall.com</a>
            . We respond within 30 days as required by GDPR.
          </Bullet>
        </ul>
      </Section>

      <Section title="Where your data lives">
        <P>
          Production data is stored in <strong>Postgres on Supabase</strong> (US region by default).
          OAuth identifiers and session tokens are stored alongside your account in the same database. Error reports go to Sentry. Analytics events (if you opted in) go to PostHog.
        </P>
        <P>
          We retain account data while your account is active. After deletion, all
          personal records are removed immediately; backups roll off within 30 days.
        </P>
      </Section>

      <Section title="GDPR, CCPA, and international transfers">
        <P>
          If you're in the EU/EEA or the UK, you have the rights granted by the GDPR (access, rectification, erasure, portability, restriction, objection). We act as the data controller and provide the rights above to fulfil them.
        </P>
        <P>
          If you're in California, the CCPA gives you the right to know, delete, and opt out of "sale." We do not sell data; the right to know and delete are provided above.
        </P>
        <P>
          If you're outside the country our database is hosted in, your data may be transferred to that country. We rely on standard contractual clauses with our data processors (Supabase, Sentry, PostHog) where applicable.
        </P>
      </Section>

      <Section title="Children">
        <P>
          GlobiQall is for users 13 and older (16 in the EU). We do not knowingly collect data from children below those ages. If you believe a child has signed up, email us and we'll delete the account.
        </P>
      </Section>

      <Section title="Changes to this policy">
        <P>
          If we materially change this policy, we'll update the "Last updated" date at the top and announce it on the site. Continued use after a change means you accept the new policy.
        </P>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 hairline-t pt-6">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-relaxed text-foreground/85 text-pretty max-w-prose">
      {children}
    </p>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-2 h-[2px] w-3 shrink-0 bg-accent" aria-hidden />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
