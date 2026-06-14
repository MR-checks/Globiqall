import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://globiqall.app";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/settings/", "/my-polls"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
