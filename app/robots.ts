import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/*",
          "/subscribe",
          "/subscribe/*",
          "/onboard",
          "/checkin",
          "/checkin/*",
          "/s",
          "/s/*",
          "/unsubscribe",
          "/unsubscribe/*",
        ],
      },
    ],
    sitemap: "https://warm-hello.com/sitemap.xml",
    host: "https://warm-hello.com",
  };
}
