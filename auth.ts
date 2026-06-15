import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Apple from "next-auth/providers/apple";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { checkLimit } from "@/lib/rate-limit";

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}
if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  );
}

// Email magic link via Nodemailer (real SMTP if configured, else dev console).
// Both paths share the same rate-limit guard, keyed on the lowercased email.
function rateLimitedSend(
  realSend: (params: { identifier: string; url: string }) => Promise<void>,
) {
  return async (params: { identifier: string; url: string }) => {
    const key = params.identifier.trim().toLowerCase();
    const rl = checkLimit("magicLink", key);
    if (!rl.ok) {
      // Throwing is the only way Auth.js will surface this to the UI.
      throw new Error(
        `Too many sign-in links sent to this email. Try again in ${Math.ceil(rl.retryAfterSec / 60)} minute(s).`,
      );
    }
    await realSend(params);
  };
}

if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER) {
  providers.push(
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? "GlobiQall <hello@globiqall.com>",
      // Wrap the default SMTP send with our rate limiter.
      sendVerificationRequest: rateLimitedSend(async ({ identifier, url }) => {
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        });
        await transport.sendMail({
          to: identifier,
          from: process.env.EMAIL_FROM ?? "GlobiQall <hello@globiqall.com>",
          subject: "Your GlobiQall sign-in link",
          text: `Sign in to GlobiQall:\n\n${url}\n\nThis link expires in 24 hours. If you didn't request it, ignore this email.`,
          html: `<p>Sign in to GlobiQall:</p><p><a href="${url}">${url}</a></p><p style="color:#888;font-size:12px">This link expires in 24 hours. If you didn't request it, ignore this email.</p>`,
        });
      }),
    }),
  );
} else {
  // Dev-only: console-logged magic links.
  providers.push(
    Nodemailer({
      server: { host: "localhost", port: 25, auth: { user: "", pass: "" } },
      from: "GlobiQall <dev@globiqall.local>",
      sendVerificationRequest: rateLimitedSend(async ({ identifier, url }) => {
        const banner = "═".repeat(72);
        console.log(`\n${banner}\n🔐 DEV magic link for ${identifier}\n${url}\n${banner}\n`);
      }),
    }),
  );
}

// Dev-only quick login (no email needed). Disabled in production.
if (process.env.NODE_ENV !== "production") {
  providers.push(
    Credentials({
      id: "dev-quick",
      name: "Dev quick login",
      credentials: {
        email: { label: "Email" },
        name: { label: "Name" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!email) return null;
        const name = String(creds?.name ?? "").trim() || email.split("@")[0];
        const user = await db.user.upsert({
          where: { email },
          update: { name },
          create: { email, name },
        });
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  );
}

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers,
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-email",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      if (token.sub) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { id: true, username: true, image: true, name: true, email: true },
        });
        if (dbUser) {
          token.username = dbUser.username ?? undefined;
          token.picture = dbUser.image ?? token.picture;
          token.name = dbUser.name ?? token.name;
          token.email = dbUser.email ?? token.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.username) (session.user as { username?: string }).username = token.username as string;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Expose which providers are enabled for the UI to render the right buttons.
export const enabledProviders = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
  apple: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
  email: true, // always enabled (real SMTP or dev console)
  devQuick: process.env.NODE_ENV !== "production",
};
