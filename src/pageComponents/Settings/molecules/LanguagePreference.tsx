"use client";

import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/utils/cn";

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
];

export function LanguagePreference() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const handleLanguageChange = (langCode: string) => {
    void i18n.changeLanguage(langCode);
    document.cookie = `i18next=${langCode};path=/;max-age=31536000`;
    if (langCode === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  };

  return (
    <Card className="w-full max-w-[520px] border-0 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-xl">
            {t("settingsPage.language")}
          </CardTitle>
        </div>
        <CardDescription>
          {t("settingsPage.languageDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                  isSelected
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-transparent bg-muted/50 hover:bg-muted",
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{lang.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{lang.name}</p>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
