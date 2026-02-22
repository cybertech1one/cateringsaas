import { TailwindIndicator } from "~/components/TailwindIndicator";
import { detectLanguage, useServerTranslation } from "~/i18n";
import { isRtlLanguage } from "~/i18n/settings";
import { Providers } from "~/providers";
import "~/styles/globals.css";
import { cn } from "~/utils/cn";
import { DM_Sans, Playfair_Display, Noto_Sans_Arabic } from "next/font/google";
import { Toaster } from "~/components/ui/toaster";
import { TRPCReactProvider } from "~/trpc/react";
import { headers } from "next/headers";
import { getServerUser } from "~/utils/auth";
import { AuthProvider } from "~/providers/AuthProvider/AuthProvider";
import { ServiceWorkerRegistration } from "~/components/PWA/ServiceWorkerRegistration";
import { CookieConsent } from "~/components/CookieConsent/CookieConsent";
import { type Metadata } from "next";
import { getAppUrl } from "~/utils/getBaseUrl";

export async function generateMetadata() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = await useServerTranslation();
  const appUrl = getAppUrl();

  return {
    title: {
      default: t("globalMetadata.title"),
      template: "%s | FeastQR",
    },
    description: t("globalMetadata.description"),
    keywords: (t("globalMetadata.keywords") as string).split(","),
    category: "restaurant menu builder",
    metadataBase: new URL(`${appUrl}/`),
    openGraph: {
      type: "website",
      locale: t("globalMetadata.openGraph.locale"),
      title: t("globalMetadata.openGraph.title"),
      url: `${appUrl}/`,
      description: t("globalMetadata.openGraph.description"),
      siteName: t("globalMetadata.openGraph.siteName"),
    },
    robots: {
      follow: true,
      index: true,
    },
    twitter: {
      card: "summary_large_image",
      title: t("globalMetadata.twitter.title"),
      description: t("globalMetadata.twitter.description"),
      site: "@feastqr",
    },
  } satisfies Metadata;
}

const font = DM_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const displayFont = Playfair_Display({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-display",
});

const arabicFont = Noto_Sans_Arabic({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
});

async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLanguage = detectLanguage(); // Detect on server, pass to client
  const dir = isRtlLanguage(initialLanguage) ? "rtl" : "ltr";

  const user = await getServerUser();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = await useServerTranslation();

  return (
    <>
      <html lang={initialLanguage} dir={dir}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="theme-color" content="#c2410c" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="FeastQR" />
          <meta name="mobile-web-app-capable" content="yes" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            font.className,
            font.variable,
            displayFont.variable,
            arabicFont.variable,
          )}
        >
          <TRPCReactProvider headers={headers()}>
            <AuthProvider {...user}>
              <Providers initialLanugage={initialLanguage}>
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:border focus:bg-background focus:p-4 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md"
                >
                  {t("accessibility.skipToContent")}
                </a>
                <div id="main-content" className="flex min-h-screen flex-col gap-6">
                  {children}
                  <TailwindIndicator />
                </div>
                <Toaster />
                <CookieConsent />
              </Providers>
            </AuthProvider>
          </TRPCReactProvider>
          <ServiceWorkerRegistration />
        </body>
      </html>
    </>
  );
}

export default RootLayout;
