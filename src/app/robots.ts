import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

function absoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
