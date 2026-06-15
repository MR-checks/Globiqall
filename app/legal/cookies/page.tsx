import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "What GlobiQall stores in your browser and why.",
};

const LAST_UPDATED = "2026-06-01";

export default function CookiesPage() {
  return (
    <article>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
        Legal · Cookies
      </div>
      <h1 className="text-[32px] sm:text-[44px] leading-[1.05] font-medium tracking-tightest text-balance">
        Cookie policy.
      </h1>
      <p className="text-muted-foreground mt-2 text-[13px] font-mono uppercase tracking-[0.08em]">
        Last updated · {LAST_UPDATED}
      </p>
      <p className="mt-5 text-[15px] leading-relaxed text-foreground/90 text-pretty">
        GlobiQall uses the minimum browser storage needed to keep you signed in and remember your preferences. Everything else is opt-in.
      </p>

      <Section title="Essential — always on">
        <P>
          These cannot be turned off — the site won't work without them.
        </P>
        <table className="mt-3 w-full text-[13px] border border-border rounded-md overflow-hidden">
          <thead className="bg-secondary/50 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="text-left p-2.5">Name</th>
              <th className="text-left p-2.5">Purpose</th>
              <th className="text-left p-2.5">Lifetime</th>
            </tr>
          </thead>
          <tbody>
            <Row name="authjs.session-token" purpose="Keeps you signed in" lifetime="30 days" />
            <Row name="authjs.csrf-token" purpose="Prevents cross-site form forgery" lifetime="Session" />
            <Row name="authjs.callback-url" purpose="Remembers where to send you after sign-in" lifetime="Session" />
            <Row name="theme" purpose="Your dark/light preference (localStorage)" lifetime="Until cleared" />
            <Row name="globiqall:guide:*" purpose="One-time UI hints you've dismissed (localStorage)" lifetime="Until cleared" />
            <Row name="globiqall:consent" purpose="Records your analytics consent choice (localStorage)" lifetime="6 months" />
          </tbody>
        </table>
      </Section>

      <Section title="Analytics — opt-in">
        <P>
          We use these only if you click "Accept analytics" in the cookie banner. You can change your mind at any time.
        </P>
        <table className="mt-3 w-full text-[13px] border border-border rounded-md overflow-hidden">
          <thead className="bg-secondary/50 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="text-left p-2.5">Service</th>
              <th className="text-left p-2.5">Purpose</th>
              <th className="text-left p-2.5">Provider</th>
            </tr>
          </thead>
          <tbody>
            <Row name="PostHog" purpose="Page views, vote events, feature usage" lifetime="posthog.com" />
            <Row name="Sentry session replay" purpose="Reproduces front-end errors for fixing" lifetime="sentry.io" />
          </tbody>
        </table>
        <P className="mt-3">
          Without analytics consent, we still capture <em>anonymous</em> server-side error stack traces via Sentry. These do not include your user ID, IP, or cookies — they're scrubbed before being sent.
        </P>
      </Section>

      <Section title="Third parties we never use">
        <P>
          We don't use Google Analytics, Facebook Pixel, TikTok Pixel, or any
          advertising/retargeting tracker. GlobiQall is not ad-supported.
        </P>
      </Section>

      <Section title="How to opt out">
        <P>
          Open the cookie banner via the link in the footer ("Cookie preferences"),
          or clear your browser storage to be re-prompted on next visit. You can
          also use your browser's built-in "Do Not Track" or block third-party
          cookies — we respect both.
        </P>
      </Section>
    </article>
  );
}

function Row({ name, purpose, lifetime }: { name: string; purpose: string; lifetime: string }) {
  return (
    <tr className="border-t border-border">
      <td className="p-2.5 font-mono text-[12px] text-foreground/90">{name}</td>
      <td className="p-2.5 text-foreground/80">{purpose}</td>
      <td className="p-2.5 font-mono text-[12px] text-muted-foreground">{lifetime}</td>
    </tr>
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

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[14px] leading-relaxed text-foreground/85 text-pretty max-w-prose ${className ?? ""}`}>
      {children}
    </p>
  );
}
