import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CookiePreferencesLink } from "@/components/cookie-preferences-link";

export function Footer() {
  return (
    <footer className="mt-24 hairline-t">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-3 md:col-span-1">
          <BrandLogo />
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs">
            Live global polls. Watch the world make up its mind.
          </p>
        </div>
        <FooterCol
          title="Browse"
          links={[
            { href: "/", label: "Trending" },
            { href: "/predictions", label: "Predictions" },
            { href: "/daily", label: "Daily Call" },
            { href: "/arenas", label: "Arenas" },
            { href: "/leagues", label: "Leagues" },
            { href: "/drops", label: "Drops" },
            { href: "/leaderboard", label: "Leaderboard" },
          ]}
        />
        <FooterCol
          title="Create"
          links={[
            { href: "/new", label: "Start a poll" },
            { href: "/my-polls", label: "My polls" },
            { href: "/new?type=BINARY", label: "Versus poll" },
            { href: "/new?visibility=PRIVATE", label: "Private poll" },
          ]}
        />
        <div>
          <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
            About
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/about"
                className="text-[13px] text-foreground/80 hover:text-foreground hover:underline underline-offset-4 decoration-accent transition-colors"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/legal/privacy"
                className="text-[13px] text-foreground/80 hover:text-foreground hover:underline underline-offset-4 decoration-accent transition-colors"
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/legal/terms"
                className="text-[13px] text-foreground/80 hover:text-foreground hover:underline underline-offset-4 decoration-accent transition-colors"
              >
                Terms
              </Link>
            </li>
            <li>
              <Link
                href="/legal/cookies"
                className="text-[13px] text-foreground/80 hover:text-foreground hover:underline underline-offset-4 decoration-accent transition-colors"
              >
                Cookies
              </Link>
            </li>
            <li>
              <CookiePreferencesLink />
            </li>
          </ul>
        </div>
      </div>
      <div className="hairline-t">
        <div className="container py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono uppercase tracking-[0.08em]">
          <span>© {new Date().getFullYear()} GlobiQall</span>
          <span>signal · live</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-[13px] text-foreground/80 hover:text-foreground hover:underline underline-offset-4 decoration-accent transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
