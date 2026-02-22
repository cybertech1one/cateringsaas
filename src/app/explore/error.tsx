"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";

export default function ExploreError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("errorPage.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("errorPage.description")}
        </p>
        <div className="flex gap-4">
          <Button className="rounded-full" onClick={() => reset()}>
            {t("errorPage.tryAgain")}
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/explore">
              {t("explore.backToExplore", "Back to Explore")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
