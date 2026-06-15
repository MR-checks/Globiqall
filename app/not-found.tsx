import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container max-w-md py-20 text-center">
      <BrandLogo size={26} />
      <div className="mt-10 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Error · 404
      </div>
      <h1 className="text-[48px] font-medium tracking-tightest mt-2">No signal.</h1>
      <p className="text-muted-foreground mt-2 text-[14px]">
        That poll wandered off. Let's get you back on course.
      </p>
      <Button asChild variant="accent" className="mt-6">
        <Link href="/">Back to GlobiQall</Link>
      </Button>
    </div>
  );
}
