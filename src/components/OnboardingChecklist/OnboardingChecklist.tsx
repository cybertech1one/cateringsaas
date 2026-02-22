"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Check, X, ChevronRight, PartyPopper } from "lucide-react";
import { Progress } from "~/components/ui/progress";

const DISMISSED_KEY = "Diyafa-onboarding-dismissed";

interface OnboardingChecklistProps {
  menus: Array<{
    id: string;
    slug: string;
    name: string;
    isPublished: boolean;
    logoImageUrl: string | null;
    _count: { dishes: number };
  }>;
}

interface Step {
  key: string;
  completed: boolean;
  href: string;
}

export function OnboardingChecklist({ menus }: OnboardingChecklistProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;
  const [dismissed, setDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);

    setDismissed(stored === "true");
  }, []);

  const steps = useMemo<Step[]>(() => {
    const hasMenu = menus.length > 0;
    const totalDishes = menus.reduce((sum, m) => sum + m._count.dishes, 0);
    const hasThreeDishes = totalDishes >= 3;
    const hasLogo = menus.some((m) => m.logoImageUrl);
    const hasPublished = menus.some((m) => m.isPublished);

    const firstMenuSlug = menus[0]?.slug;

    return [
      {
        key: "createMenu",
        completed: hasMenu,
        href: "/menu/create",
      },
      {
        key: "addDishes",
        completed: hasThreeDishes,
        href: firstMenuSlug
          ? `/menu/manage/${firstMenuSlug}/menu`
          : "/menu/create",
      },
      {
        key: "uploadLogo",
        completed: !!hasLogo,
        href: firstMenuSlug
          ? `/menu/manage/${firstMenuSlug}/restaurant`
          : "/menu/create",
      },
      {
        key: "publishMenu",
        completed: hasPublished,
        href: firstMenuSlug
          ? `/menu/manage/${firstMenuSlug}/edit`
          : "/menu/create",
      },
    ];
  }, [menus]);

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = completedCount === steps.length;
  const progressPercent = (completedCount / steps.length) * 100;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {allComplete
              ? t("onboarding.completeTitle")
              : t("onboarding.title")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {allComplete
              ? t("onboarding.completeDescription")
              : t("onboarding.description")}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("onboarding.dismiss", { defaultValue: "Dismiss onboarding checklist" })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("onboarding.progress", {
              completed: completedCount,
              total: steps.length,
            })}
          </span>
          <span className="font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {allComplete ? (
        <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
          <PartyPopper className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium text-primary">
              {t("onboarding.congratulations")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.congratulationsDetail")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <Link
              key={step.key}
              href={step.href}
              className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  step.completed
                    ? "bg-primary text-primary-foreground"
                    : "border-2 border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {step.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {t(`onboarding.steps.${step.key}`)}
                </p>
              </div>
              {!step.completed && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
