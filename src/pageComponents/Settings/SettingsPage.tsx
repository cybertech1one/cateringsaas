import { Settings, Globe, Lock, Brain, Shield, type LucideIcon } from "lucide-react";
import { useServerTranslation } from "~/i18n";
import { DashboardShell } from "../Dashboard/molecules/Shell";
import { ResetPasswordSettingsForm } from "./molecules/ResetPasswordSettingsForm";
import { AISettingsForm } from "./molecules/AISettingsForm";
import { LanguagePreference } from "./molecules/LanguagePreference";

/* ------------------------------------------------------------------ */
/*  Settings Card Wrapper                                              */
/* ------------------------------------------------------------------ */

function SettingsCard({
  icon: Icon,
  iconColor,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconColor}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="[&>*]:mx-auto">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings Page (Server Component)                                   */
/* ------------------------------------------------------------------ */

const SettingsPage = async () => {
  const { t } = await useServerTranslation();

  return (
    <DashboardShell className="flex-1">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <Settings className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {t("dashboardSidenav.settings")}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              {t("settingsPage.headerDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Language Card - spans full width on mobile, left column on desktop */}
        <SettingsCard
          icon={Globe}
          iconColor="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
          title={t("settingsPage.language")}
          description={t("settingsPage.languageDescription")}
        >
          <LanguagePreference />
        </SettingsCard>

        {/* Password Card - right column on desktop */}
        <SettingsCard
          icon={Lock}
          iconColor="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          title={t("resetPassword.title")}
          description={t("settingsPage.securityDescription", {
            defaultValue: "Keep your account secure by updating your password regularly.",
          })}
        >
          <ResetPasswordSettingsForm />
        </SettingsCard>

        {/* AI Settings Card - spans full width */}
        <div className="lg:col-span-2">
          <SettingsCard
            icon={Brain}
            iconColor="bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
            title={t("aiSettings.title")}
            description={t("aiSettings.description")}
          >
            <AISettingsForm />
          </SettingsCard>
        </div>
      </div>

      {/* Security notice footer */}
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("settingsPage.securityNotice", {
              defaultValue: "Your settings are saved securely. Changes to language take effect immediately. Password changes require re-authentication on other devices.",
            })}
          </p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default SettingsPage;
