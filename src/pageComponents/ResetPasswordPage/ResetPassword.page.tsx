"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ResetPasswordForm } from "./molecules/ResetPasswordForm";
import { KeyRound, ArrowLeft } from "lucide-react";
import { AuthVisualPanel } from "~/components/AuthVisualPanel";

export const ResetPasswordPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-72px)]">
      {/* Left: Form */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-20">
        {/* Mobile background - warm gradient visible only on small screens where right panel is hidden */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-primary/[0.02]" />
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-gold/[0.04] blur-3xl" />
          <div className="absolute inset-0 moroccan-geo opacity-[0.02]" />
        </div>

        {/* Form card - elevated on mobile */}
        <div className="relative w-full max-w-sm rounded-2xl bg-card/80 p-6 shadow-card backdrop-blur-sm lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
          {/* Mobile-only branding icon */}
          <div className="mb-6 flex justify-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-sans text-3xl font-bold tracking-tight">
              {t("resetPassword.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("resetPassword.checkYourEmail")}
            </p>
          </div>

          <ResetPasswordForm />

          <div className="mt-6 flex justify-center">
            <Link
              className="group inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              href="/login"
            >
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
              {t("register.loginButton")}
            </Link>
          </div>
        </div>
      </div>

      <AuthVisualPanel
        title={t("resetPassword.panelTitle")}
        description={t("resetPassword.panelDescription")}
        icon={KeyRound}
      />
    </div>
  );
};
