import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/i18n/config";
import { applySecurityHeaders } from "@/lib/security/headers";

const LOCALE_COOKIE = "NEXT_LOCALE";

function prefersThai(acceptLanguage: string): boolean {
  const parts = acceptLanguage.split(",").map((p) => p.trim().split(";")[0]);
  return parts.some((lang) => lang.toLowerCase().startsWith("th"));
}

function getPreferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && isLocale(cookie)) {
    return cookie;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage && prefersThai(acceptLanguage)) {
    return "th";
  }

  return defaultLocale;
}

function nextWithRequestHeaders(
  request: NextRequest,
  extraHeaders: Record<string, string>,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  for (const [key, value] of Object.entries(extraHeaders)) {
    requestHeaders.set(key, value);
  }

  return applySecurityHeaders(
    NextResponse.next({
      request: { headers: requestHeaders },
    }),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const pathnameLocale = pathname.split("/").filter(Boolean)[0];
  const hasLocalePrefix = pathnameLocale && isLocale(pathnameLocale);

  if (!hasLocalePrefix) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname =
      pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return nextWithRequestHeaders(request, { "x-locale": pathnameLocale });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
