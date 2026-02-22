"use client";

import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";

function formatCurrency(centimes: number) {
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
};

export default function FinancesDashboard() {
  const { data: revenue } = api.finances.getRevenueOverview.useQuery({});
  const { data: invoicesData, isLoading } = api.finances.listInvoices.useQuery({
    limit: 20,
  });

  const invoices = (invoicesData?.invoices ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finances</h1>
        <p className="text-sm text-muted-foreground">
          Track revenue, milestones, and invoices
        </p>
      </div>

      {/* Revenue Overview Cards */}
      {revenue && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Total Revenue</span>
              </div>
              <div className="text-xl font-bold text-emerald-700">
                {formatCurrency((revenue as Record<string, unknown>).totalRevenue as number)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="text-xl font-bold text-yellow-700">
                {formatCurrency((revenue as Record<string, unknown>).pendingAmount as number)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-xs text-muted-foreground">Overdue</span>
              </div>
              <div className="text-xl font-bold text-red-700">
                {formatCurrency((revenue as Record<string, unknown>).overdueAmount as number)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">This Month</span>
              </div>
              <div className="text-xl font-bold text-blue-700">
                {formatCurrency((revenue as Record<string, unknown>).monthRevenue as number)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices & Milestones */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <div className="grid gap-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">No invoices yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invoices are generated from event payments
                </p>
              </div>
            ) : (
              invoices.map((inv) => (
                <Card
                  key={inv.id as string}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold text-sm">
                          {inv.invoiceNumber as string}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Due: {formatDate(inv.dueDate as string)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {formatCurrency(inv.totalAmount as number)}
                      </span>
                      <Badge
                        className={
                          STATUS_COLORS[inv.status as string] ?? ""
                        }
                      >
                        {inv.status as string}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Milestone tracking is available per-event. Visit an event page to manage payment milestones.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
