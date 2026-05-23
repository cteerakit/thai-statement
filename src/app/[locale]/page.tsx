import { UploadZone } from "@/components/upload-zone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { notFound } from "next/navigation";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-10">
      <section className="space-y-4 text-center">
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="secondary">SCB</Badge>
          <Badge variant="secondary">KBank</Badge>
          <Badge variant="secondary">KTB</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {dict.home.title}
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          {dict.home.subtitle}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{dict.home.convertTitle}</CardTitle>
          <CardDescription>{dict.home.convertDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadZone dict={dict.upload} previewDict={dict.preview} />
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border p-4 space-y-1">
          <h2 className="font-medium">{dict.home.featurePrivateTitle}</h2>
          <p className="text-muted-foreground">
            {dict.home.featurePrivateBody}
          </p>
        </div>
        <div className="rounded-lg border p-4 space-y-1">
          <h2 className="font-medium">{dict.home.featureColumnsTitle}</h2>
          <p className="text-muted-foreground">
            {dict.home.featureColumnsBody}
          </p>
        </div>
        <div className="rounded-lg border p-4 space-y-1">
          <h2 className="font-medium">{dict.home.featureBanksTitle}</h2>
          <p className="text-muted-foreground">{dict.home.featureBanksBody}</p>
        </div>
      </section>
    </div>
  );
}
