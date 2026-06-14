import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <div className="container max-w-md py-20 text-center">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-md border border-border">
        <Mail className="h-5 w-5" />
      </div>
      <h1 className="text-[26px] font-medium tracking-tightest">Check your email.</h1>
      <p className="text-muted-foreground mt-2 text-[14px]">
        We sent a sign-in link to your inbox.
      </p>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground mt-8">
        dev mode? no smtp configured? check the terminal
      </p>
      <Link
        href="/"
        className="inline-block mt-8 text-sm underline decoration-accent underline-offset-4"
      >
        ← Back to globiqall
      </Link>
    </div>
  );
}
