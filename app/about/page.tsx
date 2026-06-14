import { BrandLogo } from "@/components/brand-logo";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article className="container max-w-2xl py-14 sm:py-20">
      <div className="mb-7"><BrandLogo size={26} /></div>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
        About
      </div>
      <h1 className="text-[32px] sm:text-[44px] leading-[1.05] font-medium tracking-tightest text-balance">
        Globiqall is where the world makes up its mind — together.
      </h1>
      <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground text-pretty max-w-prose">
        Every person on Earth should have a place to vote on the questions that
        matter — from the silly to the serious. Public polls for the global
        pulse. Private polls for your team, your group, your circle. Live, fair,
        free.
      </p>

      <Section id="community" title="Community">
        <ul className="space-y-2 text-[14px] text-muted-foreground">
          <Bullet>One vote per poll. Honest — you can change your mind anytime.</Bullet>
          <Bullet>Be civil. No harassment, hate, or attacks against people or groups.</Bullet>
          <Bullet>No misinformation framed as fact in poll questions.</Bullet>
          <Bullet>Keep it global. The best questions travel across cultures.</Bullet>
        </ul>
      </Section>

      <Section id="privacy" title="Privacy">
        <p className="text-[14px] text-muted-foreground leading-relaxed max-w-prose">
          We collect the minimum we need to run the site. We don't sell your
          data. Vote totals are public; individual votes are private to you.
        </p>
      </Section>

      <Section id="terms" title="Terms">
        <p className="text-[14px] text-muted-foreground leading-relaxed max-w-prose">
          By using Globiqall you agree to the community rules above and to not
          abuse the service. This is a free, beta product — provided as-is,
          improved every week.
        </p>
      </Section>
    </article>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 hairline-t pt-7">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
        {title}
      </div>
      {children}
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-accent mt-2 h-[2px] w-3 shrink-0 bg-accent" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
