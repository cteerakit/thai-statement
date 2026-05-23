import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LOGO_SRC, PRODUCT_NAME } from "@/i18n/brand";
import { defaultLocale, isLocale } from "@/i18n/config";
import { PageBackground } from "@/components/page-background";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin", "thai"],
});

const ADSENSE_CLIENT = "ca-pub-8401385083215890";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: PRODUCT_NAME,
  icons: {
    icon: LOGO_SRC,
    apple: LOGO_SRC,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const localeHeader = headerList.get("x-locale");
  const lang =
    localeHeader && isLocale(localeHeader) ? localeHeader : defaultLocale;

  return (
    <html
      lang={lang}
      className={`${googleSans.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        <PageBackground />
        {children}
        <Analytics />
        <SpeedInsights />
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
