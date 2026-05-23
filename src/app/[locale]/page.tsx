import type { Metadata } from "next";
import { UploadZone } from "@/components/upload-zone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupportedBankBadges } from "@/components/supported-bank-badge";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { createPageMetadata } from "@/i18n/metadata";
import { notFound } from "next/navigation";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = await getDictionary(localeParam);

  return createPageMetadata({
    locale: localeParam,
    pathname: "/",
    title: dict.meta.title,
    description: dict.meta.description,
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-3xl space-y-14 px-4 pb-16 pt-14 sm:pt-20">
      <section className="space-y-6 text-center">
        <div className="space-y-4">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.15]">
            {dict.home.title}
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {dict.home.subtitle}
          </p>
        </div>
        <div className="space-y-3 pt-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/80">
            {dict.home.supportedBanks}
          </p>
          <SupportedBankBadges bankLogoAlt={dict.home.bankLogoAlt} />
        </div>
      </section>

      <Card className="border-border/60 bg-card/80 shadow-lg shadow-foreground/[0.03] ring-foreground/8 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">{dict.home.convertTitle}</CardTitle>
          <CardDescription>{dict.home.convertDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadZone dict={dict.upload} previewDict={dict.preview} />
        </CardContent>
      </Card>

      <section className="grid gap-4 text-sm sm:grid-cols-3">
        <FeatureCard
          title={dict.home.featurePrivateTitle}
          body={dict.home.featurePrivateBody}
        />
        <FeatureCard
          title={dict.home.featureColumnsTitle}
          body={dict.home.featureColumnsBody}
        />
        <FeatureCard
          title={dict.home.featureBanksTitle}
          body={dict.home.featureBanksBody}
        />
      </section>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2 rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm shadow-foreground/[0.02] backdrop-blur-sm">
      <h2 className="font-medium tracking-tight">{title}</h2>
      <p className="leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
