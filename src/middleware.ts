import acceptLanguage from "accept-language";
import { type NextRequest, NextResponse } from "next/server";
import { fallbackLng, languages } from "./i18n/settings";
import { getLanguageFromAcceptHeader, getLanguageFromCookie } from "./i18n";
import { langaugeCookieExpirationTimeMs } from "./providers/I18NextProvider/I18NextProvider";

acceptLanguage.languages(languages as unknown as string[]);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)"],
};

const cookieName = "i18next";
const searchParamName = "lng";

const hasLanguageInHeader = (req: NextRequest) => {
  const nextUrlHeader =
    req.headers.has("next-url") && req.headers.get("next-url");

  return nextUrlHeader && nextUrlHeader.indexOf(`"lng":"`) > -1;
};

const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = isDevelopment
  ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co http://127.0.0.1:34321 https://flagsapi.com; connect-src 'self' https://*.supabase.co http://127.0.0.1:34321 http://localhost:34321 https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://va.vercel-scripts.com; frame-ancestors 'none';"
  : "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://flagsapi.com; connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://va.vercel-scripts.com; frame-ancestors 'none';";

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-DNS-Prefetch-Control": "on",
  "Content-Security-Policy": contentSecurityPolicy,
};

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();

  if (
    req.nextUrl.pathname.indexOf("icon") > -1 ||
    req.nextUrl.pathname.indexOf("chrome") > -1
  ) {
    const iconResponse = NextResponse.next();

    for (const [key, value] of Object.entries(securityHeaders)) {
      iconResponse.headers.set(key, value);
    }

    return iconResponse;
  }

  const languageInSearchParams = acceptLanguage.get(
    req.nextUrl.searchParams.get(searchParamName),
  );
  const languageInAcceptHeader = getLanguageFromAcceptHeader(req.headers);
  const languageInCookie = getLanguageFromCookie(req.cookies);
  const language =
    languageInSearchParams ||
    languageInCookie ||
    languageInAcceptHeader ||
    fallbackLng;

  if (hasLanguageInHeader(req) || !languageInCookie) {
    response.cookies.set(cookieName, language, {
      expires: new Date(Date.now() + langaugeCookieExpirationTimeMs),
    });
  }

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}
