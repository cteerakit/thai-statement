"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/locale-path";
import { cn } from "@/lib/utils";

const LOCALE_COOKIE = "NEXT_LOCALE";

type LocaleSwitcherProps = {
  locale: Locale;
  label: string;
  className?: string;
};

export function LocaleSwitcher({ locale, label, className }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function setLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    router.push(switchLocalePath(pathname, nextLocale));
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="sr-only">{label}</span>
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium transition-colors",
            code === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
          aria-current={code === locale ? "true" : undefined}
        >
          {localeNames[code]}
        </button>
      ))}
    </div>
  );
}
