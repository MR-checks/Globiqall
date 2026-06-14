import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { trophyTierForRep } from "@/lib/trophies";

export const runtime = "nodejs";

const BG = "#0A0E18";
const CARD = "#111726";
const BORDER = "#26304a";
const TEXT = "#F2F5FA";
const MUTED = "#8a93a8";
const ACCENT = "#4d82f7";
const GREEN = "#1ec88a";

/**
 * The Receipt — a verifiable "I called it" share card (1200×630 PNG).
 * Query: ?poll=<slug>&u=<username>
 * Renders proof that <user> correctly called <poll> N days before it resolved.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("poll") ?? "";
  const username = searchParams.get("u") ?? "";

  let title = "Called it.";
  let pick = "";
  let leadDays = 0;
  let handle = username ? `@${username}` : "@globiqall";
  let dateStr = "";
  let tierName = "";
  let valid = false;

  try {
    const poll = await db.poll.findUnique({
      where: { slug },
      select: { id: true, title: true, resolvedAt: true, resolvedOptionId: true, mode: true },
    });
    const user = username
      ? await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true, username: true, name: true } })
      : null;
    if (poll && poll.mode === "PREDICTION" && poll.resolvedAt && user) {
      const vote = await db.vote.findUnique({
        where: { pollId_userId: { pollId: poll.id, userId: user.id } },
        select: { optionId: true, correct: true, repAwarded: true, createdAt: true, option: { select: { label: true } } },
      });
      if (vote?.correct) {
        valid = true;
        title = poll.title;
        pick = vote.option.label;
        handle = `@${user.username}`;
        if (typeof vote.repAwarded === "number") tierName = trophyTierForRep(vote.repAwarded).name;
        leadDays = Math.max(
          0,
          Math.round((poll.resolvedAt.getTime() - vote.createdAt.getTime()) / 86_400_000),
        );
        dateStr = vote.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
  } catch {
    /* fall through to generic */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <svg width="34" height="34" viewBox="0 0 28 28" fill="none">
              <path d="M2 14 H8 L11 6 L14 22 L17 9 L20 14 H26" stroke={TEXT} strokeWidth="2" />
            </svg>
            <div style={{ display: "flex", fontSize: "26px", color: TEXT, fontWeight: 600 }}>
              globiqall<span style={{ color: ACCENT }}>.</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: GREEN,
              fontSize: "20px",
              border: `1px solid ${BORDER}`,
              borderRadius: "999px",
              padding: "8px 18px",
            }}
          >
            <div style={{ display: "flex", width: "10px", height: "10px", borderRadius: "999px", backgroundColor: GREEN }} />
            verified call
          </div>
        </div>

        {/* center */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" }}>
            <div style={{ display: "flex", fontSize: "22px", color: GREEN, letterSpacing: "4px" }}>
              {valid ? "I CALLED IT" : "PROOF OF FORESIGHT"}
            </div>
            {tierName && (
              <div
                style={{
                  display: "flex",
                  fontSize: "18px",
                  color: ACCENT,
                  border: `1px solid ${ACCENT}`,
                  borderRadius: "6px",
                  padding: "4px 12px",
                  letterSpacing: "2px",
                }}
              >
                {tierName.toUpperCase()} TROPHY
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 60 ? "44px" : "56px",
              color: TEXT,
              fontWeight: 600,
              lineHeight: 1.1,
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          {valid && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "30px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: CARD,
                  border: `1px solid ${GREEN}`,
                  borderRadius: "12px",
                  padding: "12px 20px",
                  color: TEXT,
                  fontSize: "28px",
                }}
              >
                <div style={{ display: "flex", width: "14px", height: "14px", borderRadius: "999px", backgroundColor: GREEN }} />
                {pick}
              </div>
              {leadDays > 0 && (
                <div style={{ display: "flex", color: MUTED, fontSize: "24px" }}>
                  called {leadDays} {leadDays === 1 ? "day" : "days"} before it happened
                </div>
              )}
            </div>
          )}
        </div>

        {/* bottom */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", color: TEXT, fontSize: "26px", fontWeight: 600 }}>{handle}</div>
          <div style={{ display: "flex", color: MUTED, fontSize: "20px" }}>
            {dateStr ? `locked ${dateStr} · ` : ""}globiqall.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
