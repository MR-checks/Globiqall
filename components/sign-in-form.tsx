"use client";

import * as React from "react";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EnabledProviders = {
  google: boolean;
  github: boolean;
  apple: boolean;
  email: boolean;
  devQuick: boolean;
};

type Props = {
  providers: EnabledProviders;
  next: string;
  oauthSignIn: (provider: string) => Promise<void>;
  emailSignIn: (formData: FormData) => Promise<{ ok: boolean; error?: string } | void>;
  quickLogin?: (formData: FormData) => Promise<{ ok: boolean; error?: string } | void>;
  initialError?: string;
};

export function SignInForm({
  providers,
  oauthSignIn,
  emailSignIn,
  quickLogin,
  initialError,
}: Props) {
  const [emailPending, setEmailPending] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const [oauthPending, setOauthPending] = React.useState<string | null>(null);
  const [quickPending, setQuickPending] = React.useState(false);

  React.useEffect(() => {
    if (initialError) toast.error("Sign-in failed. Please try again.");
  }, [initialError]);

  const handleOAuth = (provider: string) => async () => {
    setOauthPending(provider);
    try {
      await oauthSignIn(provider);
    } catch {
      setOauthPending(null);
    }
  };

  const handleEmail = async (formData: FormData) => {
    setEmailPending(true);
    try {
      const res = await emailSignIn(formData);
      if (res && !res.ok) {
        toast.error(res.error ?? "Couldn't send magic link");
      } else {
        setEmailSent(true);
        toast.success("Magic link sent", {
          description: "Check your inbox — or the dev terminal.",
        });
      }
    } finally {
      setEmailPending(false);
    }
  };

  const handleQuick = async (formData: FormData) => {
    setQuickPending(true);
    try {
      const res = await quickLogin?.(formData);
      if (res && !res.ok) toast.error(res.error ?? "Could not sign in");
    } finally {
      setQuickPending(false);
    }
  };

  const hasOAuth = providers.google || providers.github || providers.apple;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      {/* OAuth */}
      {hasOAuth && (
        <div className="grid gap-2">
          {providers.google && (
            <form action={handleOAuth("google")}>
              <Button
                type="submit"
                variant="outline"
                size="lg"
                disabled={oauthPending === "google"}
                className="w-full justify-start"
              >
                {oauthPending === "google" ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>
            </form>
          )}
          {providers.github && (
            <form action={handleOAuth("github")}>
              <Button
                type="submit"
                variant="outline"
                size="lg"
                disabled={oauthPending === "github"}
                className="w-full justify-start"
              >
                {oauthPending === "github" ? <Loader2 className="animate-spin" /> : <GitHubIcon />}
                Continue with GitHub
              </Button>
            </form>
          )}
          {providers.apple && (
            <form action={handleOAuth("apple")}>
              <Button
                type="submit"
                variant="outline"
                size="lg"
                disabled={oauthPending === "apple"}
                className="w-full justify-start"
              >
                {oauthPending === "apple" ? <Loader2 className="animate-spin" /> : <AppleIcon />}
                Continue with Apple
              </Button>
            </form>
          )}
        </div>
      )}

      {hasOAuth && <Divider label="or" />}

      {/* Email */}
      <form action={handleEmail} className="space-y-2.5">
        <label
          htmlFor="email"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
        >
          Email
        </label>
        <div className="flex gap-2">
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@somewhere.world"
            className="flex-1 h-10"
            disabled={emailPending || emailSent}
          />
          <Button
            type="submit"
            disabled={emailPending || emailSent}
            variant="accent"
            size="lg"
          >
            {emailPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Mail /> Send
              </>
            )}
          </Button>
        </div>
        {emailSent && (
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-positive">
            ✓ link sent — check your inbox (or terminal in dev)
          </p>
        )}
      </form>

      {quickLogin && (
        <>
          <Divider label="dev only" />
          <form action={handleQuick} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input name="name" placeholder="Name" className="h-10" />
              <Input name="email" type="email" required placeholder="dev@local" className="h-10" />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={quickPending}
              className="w-full"
            >
              {quickPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              Sign in instantly
            </Button>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              local-dev only — disabled in production
            </p>
          </form>
        </>
      )}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
      <span className="h-px bg-border flex-1" />
      <span>{label}</span>
      <span className="h-px bg-border flex-1" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17 35.5 11.3 29.8 11.3 23S17 10.5 24 10.5c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 4.4 29.3 2.5 24 2.5 12.4 2.5 3 11.9 3 23.5S12.4 44.5 24 44.5c11 0 21-7.8 21-21 0-1.4-.2-2.7-.4-3z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.8 29.3 4.9 24 4.9c-7.7 0-14.3 4.4-17.7 9.8z"/>
      <path fill="#4CAF50" d="M24 44.5c5.2 0 9.9-2 13.4-5.3l-6.2-5.2c-2 1.4-4.6 2.3-7.2 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.7 40.1 16.3 44.5 24 44.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.5-4.1 6l6.2 5.2c-.4.4 7.5-5.5 7.5-15.7 0-1.4-.2-2.7-.3-3z"/>
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5 3.3 9.3 7.8 10.8.6.1.8-.3.8-.6v-2c-3.2.7-3.8-1.4-3.8-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.7 1.2 3.4.9.1-.7.4-1.2.7-1.5-2.5-.3-5.2-1.3-5.2-5.6 0-1.2.4-2.3 1.1-3.1-.1-.3-.5-1.4.1-3 0 0 .9-.3 3 1.1A10.4 10.4 0 0 1 12 6.8c.9 0 1.9.1 2.8.4 2.1-1.4 3-1.1 3-1.1.6 1.6.2 2.7.1 3 .7.8 1.1 1.9 1.1 3.1 0 4.3-2.7 5.3-5.3 5.5.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.8-5.8 7.8-10.8C23.4 5.6 18.3.5 12 .5z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.5 1.5c-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.4-1.3 3.8 1.5.1 3-.8 3.9-1.8.9-1 1.5-2.4 1.1-3.9zm4.7 16.3c-.5 1.2-1.1 2.3-2 3.3-1.2 1.5-2.9 3.4-5 3.4-1.9 0-2.4-1.2-5-1.2s-3.2 1.2-5 1.2c-2.1 0-3.7-1.8-4.9-3.3C-2 17.7-1.4 11.3 1.7 8c1.1-1.2 2.7-1.9 4.3-1.9 1.9 0 3.1 1.1 4.7 1.1 1.5 0 2.5-1.1 4.7-1.1 1.6 0 3.3.9 4.5 2.4-4 2.2-3.4 7.9.3 9.3z"/>
    </svg>
  );
}
