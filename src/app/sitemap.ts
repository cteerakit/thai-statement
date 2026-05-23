import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { localizedPath } from "@/i18n/locale-path";
import { getSiteUrl } from "@/lib/site-url";

const publicPaths = ["/", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return publicPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: new URL(localizedPath(locale, path), siteUrl).toString(),
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          locales.map((pageLocale) => [
            pageLocale,
            new URL(localizedPath(pageLocale, path), siteUrl).toString(),
          ]),
        ),
      },
    })),
  );
}
