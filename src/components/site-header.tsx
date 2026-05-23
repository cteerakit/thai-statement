import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/i18n/config";
import { PRODUCT_NAME } from "@/i18n/brand";
import type { Dictionary } from "@/i18n/types";
import { localizedPath } from "@/i18n/locale-path";

type SiteHeaderProps = {
  locale: Locale;
  dict: Dictionary["nav"];
};

export function SiteHeader({ locale, dict }: SiteHeaderProps) {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={localizedPath(locale, "/")}
          className="font-semibold tracking-tight"
        >
          {PRODUCT_NAME}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <LocaleSwitcher locale={locale} label={dict.language} />
        </nav>
      </div>
    </header>
  );
}
