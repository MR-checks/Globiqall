"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readConsent, setConsent } from "@/lib/consent";

/**
 * Pulse-style consent banner. Appears once per visitor until they choose.
 * Two real choices: "Essential only" or "Accept analytics". No dark pattern.
 * Listens for /legal/cookies opening to re-prompt manually.
 */
export function ConsentBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(readConsent() === null);
    const handler = () => setVisible(readConsent() === null);
    window.addEventListener("globiqall:consent-changed", handler);
    window.addEventListener("globiqall:consent-reopen", () => setVisible(true));
    return () => {
      window.removeEventListener("globiqall:consent-changed", handler);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-50 animate-fade-in-up"
    >
      <div className="rounded-md border border-border bg-card shadow-2xl backdrop-blur-md p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
              Cookies
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/90 text-pretty">
              Essential cookies keep you signed in. Optional analytics
              ({" "}
              <Link href="/legal/cookies" className="underline decoration-accent underline-offset-4">
                see what we use
              </Link>
              {" "}
              ) help us improve the product. We never sell data or run ad trackers.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  setConsent("analytics");
                  setVisible(false);
                }}
              >
                Accept analytics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConsent("essential");
                  setVisible(false);
                }}
              >
                Essential only
              </Button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss (essential only)"
            className="h-7 w-7 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            onClick={() => {
              setConsent("essential");
              setVisible(false);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
