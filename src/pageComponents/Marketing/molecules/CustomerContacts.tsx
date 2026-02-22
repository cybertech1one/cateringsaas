"use client";

import { useState, useCallback } from "react";
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
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import { useDebounce } from "~/hooks/useDebounce";
import { formatDate } from "~/utils/formatDate";
import { Download, Search, Users, Phone } from "lucide-react";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerContacts() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = api.marketing.getCustomerContacts.useQuery({
    search: debouncedSearch || undefined,
  });

  const exportMutation = api.marketing.exportCustomerCSV.useMutation({
    onSuccess: (result) => {
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: t("marketing.contacts.exported") });
    },
    onError: () => {
      toast({
        title: t("marketing.contacts.exportFailed"),
        variant: "destructive",
      });
    },
  });

  const handleExport = useCallback(() => {
    exportMutation.mutate({});
  }, [exportMutation]);

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
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (!data || data.contacts.length === 0) {
    // Show empty state only if there is no search filter active
    if (!debouncedSearch) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">
            {t("marketing.contacts.noContacts")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("marketing.contacts.noContactsDescription")}
          </p>
        </div>
      );
    }

    // Search active but no results
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            {t("marketing.contacts.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("marketing.contacts.searchPlaceholder")}
              className="pl-10"
            />
          </div>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("marketing.contacts.noContacts")}
          </p>
        </CardContent>
      </Card>
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
            {t("marketing.contacts.title")}
          </CardTitle>
          <CardDescription>
            {t("marketing.contacts.description")}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExport}
          disabled={exportMutation.isLoading}
        >
          <Download className="h-4 w-4" />
          {t("marketing.contacts.exportCsv")}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search input */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("marketing.contacts.searchPlaceholder")}
            className="pl-10"
          />
        </div>

        {/* Stats row */}
        <div className="mb-6 flex gap-4">
          <div className="rounded-lg bg-muted/50 px-4 py-2">
            <p className="text-2xl font-bold">{data.totalCount}</p>
            <p className="text-xs text-muted-foreground">
              {t("marketing.contacts.title")}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-3 text-left font-medium text-muted-foreground">
                  {t("marketing.contacts.name")}
                </th>
                <th className="py-3 text-left font-medium text-muted-foreground">
                  {t("marketing.contacts.phone")}
                </th>
                <th className="py-3 text-left font-medium text-muted-foreground">
                  {t("marketing.contacts.totalOrders")}
                </th>
                <th className="py-3 text-left font-medium text-muted-foreground">
                  {t("marketing.contacts.totalSpent")}
                </th>
                <th className="py-3 text-left font-medium text-muted-foreground">
                  {t("marketing.contacts.lastOrder")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.contacts.map((contact) => (
                <tr
                  key={contact.phone}
                  className="border-b border-border/30 transition-colors hover:bg-muted/30"
                >
                  <td className="py-3">
                    <span className="font-medium">
                      {contact.name || t("marketing.contacts.anonymous")}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {contact.phone}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 font-medium">{contact.totalOrders}</td>
                  <td className="py-3 text-muted-foreground">
                    {(contact.totalSpent / 100).toFixed(2)}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {formatDate(contact.lastOrder, i18n.language)}
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
