import React from "react";
import { Switch } from "@headlessui/react";
import { useTranslation } from "react-i18next";

export function PricingToggle({
  enabled,
  setEnabled,
}: {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-1.5 py-1.5">
      <span className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${!enabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
        {t("landingPage.pricing.toggle.monthly")}
      </span>
      <Switch
        checked={enabled}
        onChange={setEnabled}
        className={`${
          enabled ? "bg-primary" : "bg-muted"
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200`}
      >
        <span
          className={`${
            enabled ? "translate-x-6" : "translate-x-1"
          } inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform duration-200`}
        />
      </Switch>
      <span className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${enabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
        {t("landingPage.pricing.toggle.annually")}
      </span>
    </div>
  );
}
