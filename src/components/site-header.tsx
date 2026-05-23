import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/i18n/config";
import { LOGO_SRC, PRODUCT_NAME } from "@/i18n/brand";
import type { Dictionary } from "@/i18n/types";
import { localizedPath } from "@/i18n/locale-path";

type SiteHeaderProps = {
  locale: Locale;
  dict: Dictionary["nav"];
};

export function SiteHeader({ locale, dict }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={localizedPath(locale, "/")}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <img
            src={LOGO_SRC}
            alt={dict.logoAlt}
            width={24}
            height={24}
            className="size-6 shrink-0 dark:invert"
          />
          <span aria-hidden="true">{PRODUCT_NAME}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <LocaleSwitcher locale={locale} label={dict.language} />
        </nav>
      </div>
    </header>
  );
}
