import type { MetadataRoute } from "next";

const BASE = "https://carnivon.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Landing page section anchors — help surface sections in rich results
    ...["product", "how", "metrics", "risk", "trust", "documents", "access"].map(
      (id) => ({
        url: `${BASE}/#${id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })
    ),
  ];
}
