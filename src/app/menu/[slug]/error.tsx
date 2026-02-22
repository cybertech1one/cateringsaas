"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";

export default function MenuError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="font-display text-4xl font-bold text-foreground">
          {t("errorPage.title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("errorPage.description")}
        </p>
        <div className="flex gap-4">
          <Button className="rounded-full" onClick={() => reset()}>
            {t("errorPage.tryAgain")}
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">
              {t("errorPage.goBack")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
