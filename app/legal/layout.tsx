import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container max-w-2xl py-12 sm:py-16">
      <nav className="mb-8 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <span className="mx-2 opacity-50">·</span>
        <Link href="/legal/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <span className="mx-2 opacity-50">·</span>
        <Link href="/legal/cookies" className="hover:text-foreground transition-colors">
          Cookies
        </Link>
      </nav>
      {children}
    </div>
  );
}
