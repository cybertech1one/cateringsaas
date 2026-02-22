"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import { Download, Mail, Users } from "lucide-react";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubscribersList() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data, isLoading } = api.marketing.getSubscribers.useQuery({});

  const handleExportCsv = useCallback(() => {
    if (!data?.subscribers.length) return;

    const headers = ["Email", "Name", "Date"];
    const rows = data.subscribers.map((s) => [
      s.email,
      s.name ?? "",
      new Date(s.subscribedAt).toLocaleDateString(),
    ]);

    const csvContent =
      [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join(
        "\n",
      );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: t("marketing.subscribers.exported") });
  }, [data, toast, t]);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (!data || data.subscribers.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Mail className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">
          {t("marketing.subscribers.noSubscribers")}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t("marketing.subscribers.noSubscribersDescription")}
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            {t("marketing.subscribers.title")}
          </CardTitle>
          <CardDescription>
            {t("marketing.subscribers.totalCount", { count: data.total })}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExportCsv}
        >
          <Download className="h-4 w-4" />
          {t("marketing.subscribers.exportCsv")}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Stats row */}
        <div className="mb-6 flex gap-4">
          <div className="rounded-lg bg-muted/50 px-4 py-2">
            <p className="text-2xl font-bold">{data.total}</p>
            <p className="text-xs text-muted-foreground">
              {t("marketing.subscribers.totalEmails")}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-3 text-left font-medium text-muted-foreground">
                  {t("marketing.subscribers.email")}
                </th>
                <th className="py-3 text-left font-medium text-muted-foreground">
                  {t("marketing.subscribers.name")}
                </th>
                <th className="py-3 text-left font-medium text-muted-foreground">
                  {t("marketing.subscribers.date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.subscribers.map((subscriber) => (
                <tr
                  key={subscriber.email}
                  className="border-b border-border/30 transition-colors hover:bg-muted/30"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{subscriber.email}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {subscriber.name || "-"}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(subscriber.subscribedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
