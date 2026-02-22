"use client";

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { useEffect, useRef } from "react";
import { initReactI18next, useTranslation } from "react-i18next";
import { z } from "zod";
import { getOptions, type Language, isRtlLanguage } from "~/i18n/settings";
import { zodI18nMap } from "zod-i18n-map";
import zodMessagesEn from "~/i18n/locales/en/zod";
import messagesEn from "~/i18n/locales/en/common";

export const langaugeCookieExpirationTimeMs = 1000 * 60 * 60 * 24 * 365;

void i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../../i18n/locales/${language}/${namespace}.ts`),
    ),
  )
  .init({
    ...getOptions(),
    resources: {
      en: {
        zod: zodMessagesEn,
        common: messagesEn,
      },
    },
    lng: undefined,
    detection: {
      order: ["cookie", "querystring", "htmlTag", "navigator"],
      caches: ["cookie"],
      cookieOptions: {
        expires: new Date(Date.now() + langaugeCookieExpirationTimeMs),
      },
    },
  });
z.setErrorMap(zodI18nMap);
export const I18NextProvider = ({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) => {
  const languacheChangedRef = useRef(false);
  const [, i18Next] = useTranslation();

  if (i18Next.language !== initialLanguage && !languacheChangedRef.current) {
    void i18Next.changeLanguage(initialLanguage);
    languacheChangedRef.current = true;
    z.setErrorMap(zodI18nMap);
  }

  // Update document direction when language changes (RTL support)
  useEffect(() => {
    const currentLang = i18Next.language || initialLanguage;
    const dir = isRtlLanguage(currentLang) ? "rtl" : "ltr";

    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", currentLang);
  }, [i18Next.language, initialLanguage]);

  return <>{children}</>;
};
