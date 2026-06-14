"use client";

import * as React from "react";
import { Link as LinkIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Share actions on the receipt page: native share + copy link + X intent. */
export function ReceiptShareActions({
  shareUrl,
  title,
}: {
  shareUrl: string;
  title: string;
}) {
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied");
  };

  const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${title} — receipts attached. 🧾`,
  )}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="accent" onClick={share}>
        <Share2 /> Share my receipt
      </Button>
      <Button variant="outline" onClick={copy}>
        <LinkIcon /> Copy link
      </Button>
      <Button asChild variant="outline">
        <a href={xIntent} target="_blank" rel="noopener noreferrer">
          Post to X
        </a>
      </Button>
    </div>
  );
}

/** Inline button shown on a resolved+correct prediction to jump to the receipt. */
export function ReceiptLinkButton({
  slug,
  username,
}: {
  slug: string;
  username: string;
}) {
  return (
    <Button asChild variant="accent" size="sm">
      <a href={`/receipt/${slug}?u=${encodeURIComponent(username)}`}>
        <Share2 /> Share your receipt
      </a>
    </Button>
  );
}
