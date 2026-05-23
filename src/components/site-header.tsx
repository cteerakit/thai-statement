import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/i18n/config";
import { PRODUCT_NAME } from "@/i18n/brand";
import type { Dictionary } from "@/i18n/types";
import { localizedPath } from "@/i18n/locale-path";

type SiteHeaderProps = {
  locale: Locale;
  dict: Dictionary["nav"];
};

export async function SiteHeader({ locale, dict }: SiteHeaderProps) {
  const session = await auth();

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
          {session?.user ? (
            <>
              <Link
                href={localizedPath(locale, "/history")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {dict.history}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  {dict.signOut}
                </Button>
              </form>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
