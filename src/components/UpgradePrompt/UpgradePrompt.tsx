"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Crown, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

interface UpgradePromptProps {
  resource: string;
  current: number;
  limit: number;
}

export function UpgradePrompt({ resource, current, limit }: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  if (dismissed) return null;

  // Only show when at 80% or more of the limit
  const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;

  if (percentage < 80) return null;

  const atLimit = current >= limit;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 ${
        atLimit
          ? "border-destructive/30 bg-destructive/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
      role="alert"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t("tier.dismiss")}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
            atLimit
              ? "bg-destructive/15 text-destructive"
              : "bg-amber-500/15 text-amber-600"
          }`}
        >
          <Crown className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              {atLimit
                ? t("tier.limitReached")
                : t("tier.upgradeTitle")}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("tier.upgradeDescription")}
            </p>
          </div>

          {/* Usage bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {resource}
              </span>
              <span className={`font-semibold ${atLimit ? "text-destructive" : "text-amber-600"}`}>
                {t("tier.usage", {
                  current: String(current),
                  limit: String(limit),
                })}
              </span>
            </div>
            <Progress
              value={Math.min(percentage, 100)}
              className={`h-2 ${
                atLimit ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"
              }`}
            />
          </div>

          <Link href="/dashboard/billing">
            <Button
              size="sm"
              className="rounded-full px-4 text-xs"
              variant={atLimit ? "default" : "outline"}
            >
              <Crown className="mr-1.5 h-3.5 w-3.5" />
              {t("tier.upgradeButton")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
