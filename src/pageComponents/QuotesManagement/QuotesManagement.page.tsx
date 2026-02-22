"use client";

import { useState } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Plus, FileText, Send, CheckCircle, XCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  revised: "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

function formatCurrency(centimes: number) {
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`;
}

export default function QuotesManagement() {
  const { data, isLoading } = api.quotes.listAll.useQuery({ limit: 50 });
  const quotes = (data?.quotes ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-sm text-muted-foreground">
            Create, send, and track versioned quotes for events
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading quotes...</div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No quotes yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Quotes are created from event pages
            </p>
          </div>
        ) : (
          quotes.map((quote) => (
            <Card key={quote.id as string} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold text-sm">
                      Version {quote.version as number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {quote.notes as string || "No notes"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    {formatCurrency(quote.total as number)}
                  </span>
                  <Badge className={STATUS_COLORS[quote.status as string] ?? ""}>
                    {quote.status as string}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
