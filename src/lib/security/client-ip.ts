/**
 * Client IP for rate limiting. Only trusts proxy headers when the platform
 * sets them (Vercel) or TRUST_PROXY_HEADERS=1 is configured explicitly.
 */
export function getTrustedClientIp(request: Request): string {
  if (process.env.VERCEL === "1") {
    const vercelIp = request.headers.get("x-real-ip");
    if (vercelIp?.trim()) {
      return vercelIp.trim();
    }
  }

  if (process.env.TRUST_PROXY_HEADERS === "1") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp?.trim()) {
      return realIp.trim();
    }
  }

  return "anonymous";
}
