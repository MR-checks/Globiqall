import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The rules of using GlobiQall. Plain English, no fine print.",
};

const LAST_UPDATED = "2026-06-01";

export default function TermsPage() {
  return (
    <article>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
        Legal · Terms
      </div>
      <h1 className="text-[32px] sm:text-[44px] leading-[1.05] font-medium tracking-tightest text-balance">
        Terms of service.
      </h1>
      <p className="text-muted-foreground mt-2 text-[13px] font-mono uppercase tracking-[0.08em]">
        Last updated · {LAST_UPDATED}
      </p>
      <p className="mt-5 text-[15px] leading-relaxed text-foreground/90 text-pretty">
        Plain rules for using GlobiQall. By creating an account or casting a vote,
        you agree to these.
      </p>

      <Section title="What GlobiQall is">
        <P>
          GlobiQall is a global polling platform. People create polls, vote, comment,
          and watch results update live. The service is free to use, in beta, and
          provided "as-is" without warranty of any kind.
        </P>
      </Section>

      <Section title="Who can use it">
        <ul className="space-y-2 text-[14px] text-foreground/85">
          <Bullet>You must be 13 or older (16 in the EU).</Bullet>
          <Bullet>One person, one account. No automated sign-ups or bot accounts.</Bullet>
          <Bullet>You're responsible for what happens under your account. Keep your email and OAuth provider secure.</Bullet>
        </ul>
      </Section>

      <Section title="What you can and can't post">
        <P>You're welcome to post polls, options, and comments that:</P>
        <ul className="mt-3 space-y-2 text-[14px] text-foreground/85">
          <Bullet>Ask real questions you're curious about.</Bullet>
          <Bullet>Take real positions, even unpopular ones, expressed civilly.</Bullet>
          <Bullet>Are written by you (or attribute clearly when quoting).</Bullet>
        </ul>
        <P className="mt-4">You may not post content that:</P>
        <ul className="mt-3 space-y-2 text-[14px] text-foreground/85">
          <Bullet>Attacks people or groups based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, age, disability, or serious medical condition.</Bullet>
          <Bullet>Threatens, harasses, doxxes, or incites violence against any person.</Bullet>
          <Bullet>Sexualizes minors or contains exploitative material, zero tolerance, immediate ban + reporting to authorities.</Bullet>
          <Bullet>Misrepresents facts as questions ("Did X person commit a crime?"). Polls are for opinion, prediction, and debate, not for accusing real people of unproven acts.</Bullet>
          <Bullet>Spams, phishes, or distributes malware.</Bullet>
          <Bullet>Infringes someone else's copyright or trademark.</Bullet>
          <Bullet>Violates any law that applies to you.</Bullet>
        </ul>
      </Section>

      <Section title="Voting fairly">
        <ul className="space-y-2 text-[14px] text-foreground/85">
          <Bullet>One vote per poll per person. Multi-accounting to inflate counts is grounds for losing all your votes and your account.</Bullet>
          <Bullet>You can change your mind on any open poll until it closes.</Bullet>
          <Bullet>You may not use scripts, bots, or paid services to manipulate counts.</Bullet>
        </ul>
      </Section>

      <Section title="Your content, our license">
        <P>
          You own what you post. You give GlobiQall a worldwide, royalty-free,
          non-exclusive license to host, display, format, and distribute it on the
          service. This license ends when you delete the content, except for
          aggregate vote counts and analytics, which remain anonymous and unattributed.
        </P>
        <P>
          We may remove content that breaks these rules. We try to be transparent
          about removals, but we don't have to give a reason.
        </P>
      </Section>

      <Section title="Account suspension + deletion">
        <P>
          We may suspend or delete accounts that abuse the service, break these
          rules, or put the community at risk. You can delete your own account at
          any time via{" "}
          <a className="underline decoration-accent underline-offset-4" href="/settings/account">
            /settings/account
          </a>
          .
        </P>
      </Section>

      <Section title="Things we don't promise">
        <ul className="space-y-2 text-[14px] text-foreground/85">
          <Bullet>The service is provided "AS-IS" without warranties of any kind, express or implied, including merchantability and fitness for a particular purpose.</Bullet>
          <Bullet>We don't promise the service will be uninterrupted, error-free, or available everywhere.</Bullet>
          <Bullet>Poll results reflect the views of the people who voted, not factual truth.</Bullet>
        </ul>
      </Section>

      <Section title="Limit of liability">
        <P>
          To the maximum extent allowed by law, GlobiQall, its operators, and its
          contributors are not liable for indirect, incidental, consequential, or
          punitive damages, or for lost profits or data, arising from your use of
          the service. Our total liability is capped at one hundred US dollars
          ($100) or the amount you've paid us in the last twelve months, whichever
          is greater, and you haven't paid us anything because the service is free.
        </P>
      </Section>

      <Section title="Governing law">
        <P>
          These Terms are governed by the laws of the operator's primary place of
          residence, without regard to conflict-of-law principles. Disputes will be
          resolved in the courts located there. If you're in the EU or UK, this
          doesn't override mandatory consumer protections you have at home.
        </P>
      </Section>

      <Section title="Changes to these Terms">
        <P>
          We may update these Terms. When we do, we'll change the "Last updated"
          date and post a notice on the site. Material changes will give you at
          least 14 days before they take effect. Continued use after the effective
          date means you accept the new Terms.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Questions:{" "}
          <a className="underline decoration-accent underline-offset-4" href="mailto:hello@globiqall.com">
            hello@globiqall.com
          </a>
          . Abuse/legal:{" "}
          <a className="underline decoration-accent underline-offset-4" href="mailto:abuse@globiqall.com">
            abuse@globiqall.com
          </a>
          .
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

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[14px] leading-relaxed text-foreground/85 text-pretty max-w-prose ${className ?? ""}`}>
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
