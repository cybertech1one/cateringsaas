"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check, Loader2, AlertCircle, Cpu, Zap } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { api } from "~/trpc/react";
import { useTranslation } from "react-i18next";

const providerMeta: Record<string, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  openai: {
    label: "OpenAI",
    description: "GPT-4o series models",
    color: "border-emerald-500/40 bg-emerald-500/5",
    icon: <Zap className="h-5 w-5 text-emerald-500" />,
  },
  anthropic: {
    label: "Anthropic",
    description: "Claude model family",
    color: "border-orange-500/40 bg-orange-500/5",
    icon: <Cpu className="h-5 w-5 text-orange-500" />,
  },
  google: {
    label: "Google",
    description: "Gemini model family",
    color: "border-blue-500/40 bg-blue-500/5",
    icon: <Sparkles className="h-5 w-5 text-blue-500" />,
  },
};

export function AISettingsForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: providers, isLoading: providersLoading } =
    api.ai.getAvailableProviders.useQuery();
  const { data: settings, isLoading: settingsLoading } =
    api.ai.getAISettings.useQuery();
  const updateSettings = api.ai.updateAISettings.useMutation();

  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    if (settings) {
      setSelectedProvider(settings.provider);
      setSelectedModel(settings.model);
    }
  }, [settings]);

  const isLoading = providersLoading || settingsLoading;
  const hasProviders = providers && providers.length > 0;

  const currentProviderModels =
    providers?.find((p) => p.name === selectedProvider)?.models ?? [];

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        provider: selectedProvider,
        model: selectedModel,
      });
      toast({
        title: t("aiSettings.settingsUpdated"),
        description: t("aiSettings.settingsUpdatedDescription", {
          provider: providerMeta[selectedProvider]?.label ?? selectedProvider,
          model: selectedModel,
        }),
        duration: 3000,
      });
    } catch {
      toast({
        title: t("aiSettings.settingsUpdateFailed"),
        description: t("aiSettings.settingsUpdateFailedDescription"),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const isDirty =
    settings &&
    (selectedProvider !== settings.provider || selectedModel !== settings.model);

  return (
    <Card className="w-full max-w-[520px] border-0 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-xl">{t("aiSettings.title")}</CardTitle>
        </div>
        <CardDescription>
          {t("aiSettings.description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !hasProviders && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t("aiSettings.noProviders")}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t("aiSettings.noProvidersDescription")}
              </p>
            </div>
          </div>
        )}

        {!isLoading && hasProviders && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("aiSettings.provider")}
              </label>
              <div className="grid gap-2">
                {providers.map((p) => {
                  const meta = providerMeta[p.name];
                  const isSelected = selectedProvider === p.name;

                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(p.name);
                        setSelectedModel(p.models[0]?.id ?? "");
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                        isSelected
                          ? `${meta?.color ?? ""} ring-1 ring-primary/20`
                          : "border-transparent bg-muted/50 hover:bg-muted",
                      )}
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-background shadow-sm">
                        {meta?.icon ?? <Cpu className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {meta?.label ?? p.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meta?.description ?? `${p.models.length} models`}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("aiSettings.model")}
              </label>
              <div className="grid gap-1.5">
                {currentProviderModels.map((m) => {
                  const isSelected = selectedModel === m.id;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span>{m.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!isDirty || updateSettings.isLoading}
              className="w-full"
            >
              {updateSettings.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("aiSettings.save")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
