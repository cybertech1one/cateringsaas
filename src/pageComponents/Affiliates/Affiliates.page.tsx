"use client";

import { useCallback } from "react";
import { api } from "~/trpc/react";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { formatPrice } from "~/utils/currency";
import {
  Copy,
  Share2,
  Users,
  UserCheck,
  Clock,
  Gift,
  ArrowRight,
  MessageCircle,
} from "lucide-react";

export function AffiliatesPage() {
  const { toast } = useToast();
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  const {
    data: codeData,
    isLoading: codeLoading,
    isError: codeError,
  } = api.affiliates.getMyReferralCode.useQuery();

  const { data: stats, isLoading: statsLoading } =
    api.affiliates.getReferralStats.useQuery();

  const { data: referrals, isLoading: referralsLoading } =
    api.affiliates.getMyReferrals.useQuery();

  const referralCode = codeData?.referralCode ?? "";
  const referralUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : "";

  const handleCopyCode = useCallback(() => {
    void navigator.clipboard.writeText(referralCode);
    toast({
      title: t("affiliates.codeCopied"),
    });
  }, [referralCode, toast, t]);

  const handleCopyLink = useCallback(() => {
    void navigator.clipboard.writeText(referralUrl);
    toast({
      title: t("affiliates.linkCopied"),
    });
  }, [referralUrl, toast, t]);

  const handleShareWhatsApp = useCallback(() => {
    const message = t("affiliates.whatsAppMessage", {
      code: referralCode,
      url: referralUrl,
    });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  }, [referralCode, referralUrl, t]);

  const getStatusBadge = useCallback(
    (status: string) => {
      if (status === "rewarded") {
        return (
          <Badge variant="default" className="bg-emerald-600">
            {t("affiliates.statusRewarded")}
          </Badge>
        );
      }

      if (status === "completed") {
        return (
          <Badge variant="default" className="bg-blue-600">
            {t("affiliates.statusCompleted")}
          </Badge>
        );
      }

      return <Badge variant="secondary">{t("affiliates.statusPending")}</Badge>;
    },
    [t],
  );

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-sm">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {t("affiliates.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("affiliates.description")}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-violet-600" />}
            label={t("affiliates.totalReferred")}
            value={statsLoading ? undefined : String(stats?.totalReferred ?? 0)}
          />
          <StatCard
            icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
            label={t("affiliates.completedSignups")}
            value={statsLoading ? undefined : String(stats?.completed ?? 0)}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            label={t("affiliates.pendingSignups")}
            value={statsLoading ? undefined : String(stats?.pending ?? 0)}
          />
          <StatCard
            icon={<Gift className="h-5 w-5 text-rose-600" />}
            label={t("affiliates.rewardsEarned")}
            value={
              statsLoading
                ? undefined
                : formatPrice(stats?.totalRewards ?? 0)
            }
          />
        </div>

        {/* Referral Code Section */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {t("affiliates.referralCode")}
          </h2>

          {codeLoading && (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full max-w-md" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-44" />
              </div>
            </div>
          )}

          {codeError && (
            <p className="text-sm text-destructive">
              {t("affiliates.errorLoadingCode")}
            </p>
          )}

          {!codeLoading && !codeError && referralCode && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 items-center rounded-lg border border-border/60 bg-muted/50 px-4 font-mono text-lg font-bold tracking-wider">
                  {referralCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {t("affiliates.copyCode")}
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {t("affiliates.shareReferralLink")}
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  className="gap-2 bg-[#25D366] text-white hover:bg-[#20BD5A]"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("affiliates.shareViaWhatsApp")}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* How It Works */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">
            {t("affiliates.howItWorks")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              step={1}
              title={t("affiliates.step1Title")}
              description={t("affiliates.step1Description")}
              icon={<Share2 className="h-6 w-6" />}
            />
            <StepCard
              step={2}
              title={t("affiliates.step2Title")}
              description={t("affiliates.step2Description")}
              icon={<UserCheck className="h-6 w-6" />}
            />
            <StepCard
              step={3}
              title={t("affiliates.step3Title")}
              description={t("affiliates.step3Description")}
              icon={<Gift className="h-6 w-6" />}
            />
          </div>
        </div>

        {/* Referral History */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {t("affiliates.referralHistory")}
          </h2>

          {referralsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          )}

          {!referralsLoading && (!referrals || referrals.length === 0) && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                {t("affiliates.noReferrals")}
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t("affiliates.noReferralsDescription")}
              </p>
            </div>
          )}

          {!referralsLoading && referrals && referrals.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">
                      {t("affiliates.referredEmail")}
                    </th>
                    <th className="pb-3 pr-4 font-medium">
                      {t("affiliates.status")}
                    </th>
                    <th className="pb-3 pr-4 font-medium">
                      {t("affiliates.reward")}
                    </th>
                    <th className="pb-3 font-medium">
                      {t("affiliates.date")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="py-3 pr-4 text-sm">
                        {referral.referredEmail}
                      </td>
                      <td className="py-3 pr-4">
                        {getStatusBadge(referral.status)}
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        {formatPrice(referral.rewardAmount)}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardShell>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2">
        {value === undefined ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
        {icon}
      </div>
      <span className="mt-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
        {step}
      </span>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {step < 3 && (
        <ArrowRight className="absolute -right-3 top-6 hidden h-5 w-5 text-muted-foreground md:block" />
      )}
    </div>
  );
}
