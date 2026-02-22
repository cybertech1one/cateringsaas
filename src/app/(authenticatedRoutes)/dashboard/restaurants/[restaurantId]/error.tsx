"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";

export default function RestaurantDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("errorPage.title")}
        </h2>
        <p className="text-muted-foreground">
          {t("errorPage.description")}
        </p>
        <div className="flex gap-3">
          <Button onClick={() => reset()} variant="default">
            {t("errorPage.tryAgain")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/restaurants">
              {t("errorPage.goBack")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
