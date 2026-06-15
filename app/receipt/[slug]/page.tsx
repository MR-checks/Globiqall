import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ReceiptShareActions } from "@/components/receipt-share-button";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ u?: string }>;
};

async function load(slug: string, username?: string) {
  const poll = await db.poll.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      mode: true,
      resolvedAt: true,
      resolvedOptionId: true,
    },
  });
  if (!poll || poll.mode !== "PREDICTION" || !poll.resolvedAt) return null;
  const user = username
    ? await db.user.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true, username: true, name: true, image: true },
      })
    : null;
  if (!user) return null;
  const vote = await db.vote.findUnique({
    where: { pollId_userId: { pollId: poll.id, userId: user.id } },
    select: { correct: true, createdAt: true, conviction: true, option: { select: { label: true } } },
  });
  if (!vote?.correct) return null;
  const leadDays = Math.max(
    0,
    Math.round((poll.resolvedAt.getTime() - vote.createdAt.getTime()) / 86_400_000),
  );
  return { poll, user, vote, leadDays };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { u } = await searchParams;
  const data = await load(slug, u);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!data) return { title: "Receipt" };
  const img = `${base}/api/og/receipt?poll=${encodeURIComponent(slug)}&u=${encodeURIComponent(u ?? "")}`;
  const title = `@${data.user.username} called it`;
  const desc = `"${data.poll.title}" — called ${data.leadDays} days early. Verified by GlobiQall.`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description: desc, images: [img] },
  };
}

export default async function ReceiptPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { u } = await searchParams;
  const data = await load(slug, u);
  if (!data) notFound();

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  // Relative for the on-page <img> so it works on any host/port; absolute only for share links.
  const imgUrl = `/api/og/receipt?poll=${encodeURIComponent(slug)}&u=${encodeURIComponent(u ?? "")}`;
  const shareUrl = `${base}/receipt/${slug}?u=${encodeURIComponent(u ?? "")}`;

  return (
    <div className="container max-w-2xl py-12 sm:py-16">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-positive mb-2 inline-flex items-center gap-2">
        <Check className="h-3 w-3" /> Verified call
      </div>
      <h1 className="text-[28px] sm:text-[36px] leading-[1.05] font-medium tracking-tightest">
        <Link href={`/u/${data.user.username}`} className="hover:underline decoration-accent underline-offset-4">
          @{data.user.username}
        </Link>{" "}
        called it.
      </h1>

      {/* The receipt image itself */}
      <div className="mt-6 rounded-md border border-border overflow-hidden bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl} alt="Receipt" className="w-full block" />
      </div>

      <div className="mt-5">
        <ReceiptShareActions shareUrl={shareUrl} title={`I called "${data.poll.title}" on GlobiQall`} />
      </div>

      <div className="mt-6 flex items-center justify-between text-[13px]">
        <Link
          href={`/p/${data.poll.slug}`}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> See the prediction
        </Link>
        <Button asChild variant="accent" size="sm">
          <Link href="/predictions">Make your own call</Link>
        </Button>
      </div>
    </div>
  );
}
