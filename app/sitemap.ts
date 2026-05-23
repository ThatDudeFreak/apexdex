import type { MetadataRoute } from "next";
import { getAllLegends } from "@/lib/legends";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/map-rotation`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/predator-rp-cutoff`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/crafting-rotation`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
  for (const l of getAllLegends()) {
    base.push({
      url: `${SITE_URL}/legends/${l.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
  return base;
}
