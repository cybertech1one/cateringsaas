"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import {
  Database,
  RefreshCw,
  Settings,
  Check,
  X,
  Users,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { cn } from "~/utils/cn";

export function CRMPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const utils = api.useContext();

  const [apiKey, setApiKey] = useState("");
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const { data: config, isLoading: configLoading } =
    api.crm.getConfig.useQuery();

  const saveConfig = api.crm.saveConfig.useMutation({
    onSuccess: () => {
      toast({
        title: t("crm.toast.configSaved"),
        description: t("crm.toast.connectionSuccess"),
      });
      void utils.crm.getConfig.invalidate();
      setApiKey("");
    },
    onError: (error) => {
      toast({
        title: t("crm.toast.connectionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeConfig = api.crm.removeConfig.useMutation({
    onSuccess: () => {
      toast({ title: t("crm.toast.configRemoved") });
      void utils.crm.getConfig.invalidate();
      setShowRemoveConfirm(false);
    },
  });

  const testConnection = api.crm.testConnection.useMutation({
    onSuccess: (result) => {
      toast({
        title: result.connected
          ? t("crm.toast.connectionSuccess")
          : t("crm.toast.connectionFailed"),
        variant: result.connected ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: t("crm.toast.connectionFailed"),
        variant: "destructive",
      });
    },
  });

  const syncCustomers = api.crm.syncCustomers.useMutation({
    onSuccess: (result) => {
      toast({
        title: t("crm.sync.syncComplete"),
        description: `${t("crm.sync.syncedCount", { count: result.synced })}${result.failed > 0 ? ` | ${t("crm.sync.failedCount", { count: result.failed })}` : ""}`,
      });
      void utils.crm.getConfig.invalidate();
    },
    onError: () => {
      toast({
        title: t("crm.toast.syncFailed"),
        variant: "destructive",
      });
    },
  });

  const syncOrders = api.crm.syncOrders.useMutation({
    onSuccess: (result) => {
      toast({
        title: t("crm.sync.syncComplete"),
        description: `${t("crm.sync.syncedCount", { count: result.synced })}${result.failed > 0 ? ` | ${t("crm.sync.failedCount", { count: result.failed })}` : ""}`,
      });
      void utils.crm.getConfig.invalidate();
    },
    onError: () => {
      toast({
        title: t("crm.toast.syncFailed"),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!apiKey || !workspaceUrl) return;
    saveConfig.mutate({ apiKey, workspaceUrl, autoSync });
  };

  const handleTest = () => {
    if (!apiKey || !workspaceUrl) return;
    testConnection.mutate({ apiKey, workspaceUrl });
  };

  const isSyncing = syncCustomers.isLoading || syncOrders.isLoading;

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Page Header */}
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {t("crm.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("crm.description")}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {!configLoading && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                config?.isConfigured
                  ? "bg-green-500/10 text-green-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {config?.isConfigured ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {config?.isConfigured
                ? t("crm.status.connected")
                : t("crm.status.notConfigured")}
            </div>
          )}
        </div>

        {configLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* Setup Section */}
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("crm.setup.title")}
                </h2>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                {t("crm.setup.description")}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("crm.setup.apiKeyLabel")}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      config?.hasApiKey
                        ? "••••••••••••••••"
                        : t("crm.setup.apiKeyPlaceholder")
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("crm.setup.workspaceUrlLabel")}
                  </label>
                  <input
                    type="url"
                    value={workspaceUrl}
                    onChange={(e) => setWorkspaceUrl(e.target.value)}
                    placeholder={
                      config?.workspaceUrl ??
                      t("crm.setup.workspaceUrlPlaceholder")
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("crm.setup.autoSync")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("crm.setup.autoSyncDescription")}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoSync}
                    onClick={() => setAutoSync((prev) => !prev)}
                    className={cn(
                      "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
                      autoSync ? "bg-primary" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        autoSync ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={
                      !apiKey ||
                      !workspaceUrl ||
                      testConnection.isLoading
                    }
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("crm.setup.testConnection")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={
                      !apiKey ||
                      !workspaceUrl ||
                      saveConfig.isLoading
                    }
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saveConfig.isLoading
                      ? t("crm.setup.saving")
                      : t("crm.setup.save")}
                  </button>
                </div>
              </div>
            </div>

            {/* Sync Section - Only show when configured */}
            {config?.isConfigured && (
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <RefreshCw
                    className={cn(
                      "h-5 w-5 text-primary",
                      isSyncing && "animate-spin",
                    )}
                  />
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("crm.sync.title")}
                  </h2>
                </div>

                <p className="mb-2 text-sm text-muted-foreground">
                  {config.lastSyncedAt
                    ? t("crm.status.lastSynced", {
                        date: new Date(
                          config.lastSyncedAt,
                        ).toLocaleString(),
                      })
                    : t("crm.status.neverSynced")}
                </p>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => syncCustomers.mutate()}
                    disabled={isSyncing}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Users className="h-4 w-4" />
                    {syncCustomers.isLoading
                      ? t("crm.sync.syncing")
                      : t("crm.sync.syncCustomers")}
                  </button>
                  <button
                    type="button"
                    onClick={() => syncOrders.mutate()}
                    disabled={isSyncing}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {syncOrders.isLoading
                      ? t("crm.sync.syncing")
                      : t("crm.sync.syncOrders")}
                  </button>
                </div>
              </div>
            )}

            {/* Remove Configuration */}
            {config?.isConfigured && (
              <div className="rounded-xl border border-destructive/20 bg-card p-6">
                {showRemoveConfirm ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground">
                      {t("crm.setup.removeConfirm")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRemoveConfirm(false)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                      >
                        {t("common.backButton")}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeConfig.mutate()}
                        disabled={removeConfig.isLoading}
                        className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                      >
                        {t("crm.setup.remove")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirm(true)}
                    className="flex items-center gap-2 text-sm text-destructive transition-colors hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("crm.setup.remove")}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </DashboardShell>
    </main>
  );
}
