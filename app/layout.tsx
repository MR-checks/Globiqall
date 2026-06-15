import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ConsentBanner } from "@/components/consent-banner";
import { AnalyticsProvider } from "@/components/analytics-provider";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GlobiQall — The world is voting",
    template: "%s · GlobiQall",
  },
  description:
    "Live global polls. Vote, settle debates, and watch the world make up its mind in real time.",
  applicationName: "GlobiQall",
  icons: {
    icon: [
      {
        url: "/favicon-64-dark.png",
        type: "image/png",
        sizes: "64x64",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-64-light.png",
        type: "image/png",
        sizes: "64x64",
        media: "(prefers-color-scheme: light)",
      },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "GlobiQall — The world is voting",
    description:
      "Live global polls. Vote, settle debates, and watch the world make up its mind in real time.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0B" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen flex flex-col font-sans">
        <ThemeProvider>
          <AnalyticsProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <ConsentBanner />
            <Toaster
              theme="system"
              position="bottom-right"
              toastOptions={{
                className:
                  "rounded-md border border-border bg-card text-card-foreground",
              }}
            />
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
