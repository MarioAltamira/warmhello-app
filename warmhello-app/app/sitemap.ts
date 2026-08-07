import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://warm-hello.com";
  const today = new Date();
  const modified = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  return [
    {
      url: `${base}/`,
      lastModified: modified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/auth`,
      lastModified: modified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
