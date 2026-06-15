/**
 * Tiny transactional-email helper. Uses SMTP (the same EMAIL_SERVER_* config as
 * Auth.js) when configured; otherwise logs to the server console in dev. Never
 * throws — callers treat email as best-effort.
 */

const FROM = process.env.EMAIL_FROM ?? "GlobiQall <hello@globiqall.app>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;

  if (!host || !user) {
    if (process.env.NODE_ENV !== "production") {
      const banner = "─".repeat(60);
      console.log(
        `\n${banner}\n✉️  EMAIL (dev) → ${opts.to}\n${opts.subject}\n${opts.text}\n${banner}\n`,
      );
    }
    return;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
      auth: { user, pass: process.env.EMAIL_SERVER_PASSWORD },
    });
    await transport.sendMail({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? `<p>${opts.text}</p>`,
    });
  } catch {
    /* swallow — email must never break the app */
  }
}
