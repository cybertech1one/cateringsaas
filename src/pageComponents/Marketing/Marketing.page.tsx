"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Megaphone,
  Eye,
  Share2,
  Tag,
  Mail,
  Users,
  MessageSquare,
  QrCode,
} from "lucide-react";
import { cn } from "~/utils/cn";
import { CouponManager } from "./molecules/CouponManager";
import { ShareTracking } from "./molecules/ShareTracking";
import { SubscribersList } from "./molecules/SubscribersList";
import { CustomerContacts } from "./molecules/CustomerContacts";
import { WhatsAppBroadcast } from "./molecules/WhatsAppBroadcast";
import { PromoFlyer } from "./molecules/PromoFlyer";

// ---------------------------------------------------------------------------
// Period options
// ---------------------------------------------------------------------------

type Period = "today" | "7d" | "30d" | "90d" | "all";

const PERIOD_OPTIONS: { value: Period; labelKey: string }[] = [
  { value: "today", labelKey: "analyticsPage.periods.today" },
  { value: "7d", labelKey: "analyticsPage.periods.7d" },
  { value: "30d", labelKey: "analyticsPage.periods.30d" },
  { value: "90d", labelKey: "analyticsPage.periods.90d" },
  { value: "all", labelKey: "analyticsPage.periods.all" },
];

// ---------------------------------------------------------------------------
// Overview Card
// ---------------------------------------------------------------------------

function OverviewCard({
  title,
  value,
  icon: Icon,
  loading,
  gradient,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  gradient?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm",
          gradient ?? "bg-gradient-to-br from-primary/20 to-primary/5"
        )}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <div className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MarketingPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("30d");

  const { data: overview, isLoading: overviewLoading } =
    api.marketing.getMarketingOverview.useQuery({ period });

  const { data: restaurants, isLoading: restaurantsLoading } =
    api.restaurants.getRestaurants.useQuery();

  if (restaurantsLoading) return <LoadingScreen />;

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Page Header */}
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {t("marketing.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("marketing.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-1.5 rounded-lg bg-muted/30 p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                period === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t(opt.labelKey as never)}
            </button>
          ))}
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title={t("marketing.overview.activePromotions")}
            value={overview?.activePromotions ?? 0}
            icon={Megaphone}
            loading={overviewLoading}
          />
          <OverviewCard
            title={t("marketing.overview.totalCouponUses")}
            value={overview?.totalCouponUses ?? 0}
            icon={Tag}
            loading={overviewLoading}
          />
          <OverviewCard
            title={t("marketing.overview.menuViews")}
            value={overview?.menuViews ?? 0}
            icon={Eye}
            loading={overviewLoading}
          />
          <OverviewCard
            title={t("marketing.overview.socialShares")}
            value={overview?.socialShares ?? 0}
            icon={Share2}
            loading={overviewLoading}
          />
        </div>

        {/* Tabbed sections */}
        <Tabs defaultValue="coupons" className="w-full">
          <TabsList className="h-auto gap-1 rounded-xl bg-muted/40 p-1">
            <TabsTrigger value="coupons" className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">{t("marketing.tabs.coupons")}</span>
              <span className="sm:hidden">{t("marketing.tabs.couponsShort")}</span>
            </TabsTrigger>
            <TabsTrigger value="shares" className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("marketing.tabs.shares")}</span>
              <span className="sm:hidden">{t("marketing.tabs.sharesShort")}</span>
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">{t("marketing.tabs.subscribers")}</span>
              <span className="sm:hidden">{t("marketing.tabs.subscribersShort")}</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t("marketing.tabs.contacts")}</span>
              <span className="sm:hidden">{t("marketing.tabs.contactsShort")}</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t("marketing.tabs.whatsapp")}</span>
              <span className="sm:hidden">{t("marketing.tabs.whatsappShort")}</span>
            </TabsTrigger>
            <TabsTrigger value="flyer" className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">{t("marketing.tabs.flyer")}</span>
              <span className="sm:hidden">{t("marketing.tabs.flyerShort")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coupons" className="mt-6">
            <CouponManager restaurants={restaurants ?? []} />
          </TabsContent>

          <TabsContent value="shares" className="mt-6">
            <ShareTracking period={period} />
          </TabsContent>

          <TabsContent value="subscribers" className="mt-6">
            <SubscribersList />
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <CustomerContacts />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-6">
            <WhatsAppBroadcast />
          </TabsContent>

          <TabsContent value="flyer" className="mt-6">
            <PromoFlyer />
          </TabsContent>
        </Tabs>
      </DashboardShell>
    </main>
  );
}
