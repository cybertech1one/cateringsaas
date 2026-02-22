"use client";

import { useCallback } from "react";
import { api } from "~/trpc/react";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { DashboardHeader } from "~/pageComponents/Dashboard/molecules/Header";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Users,
  Stamp,
  Gift,
  TrendingUp,
  Check,
} from "lucide-react";

type LoyaltyProgram = {
  id: string;
  menuId: string;
  name: string;
  description: string | null;
  stampsRequired: number;
  rewardDescription: string;
  rewardType: string;
  rewardValue: number | null;
  isActive: boolean | null;
  icon: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { cards: number };
};

type LoyaltyCard = {
  id: string;
  programId: string;
  customerIdentifier: string;
  stampsCollected: number;
  isRedeemed: boolean | null;
  redeemedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface CardsPanelProps {
  program: LoyaltyProgram;
  onBack: () => void;
  onRefetchPrograms: () => void;
}

export function CardsPanel({
  program,
  onBack,
  onRefetchPrograms,
}: CardsPanelProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: stats, isLoading: statsLoading } =
    api.loyalty.getProgramStats.useQuery({ programId: program.id });

  const {
    data: cardsData,
    isLoading: cardsLoading,
    refetch: refetchCards,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.loyalty.getCards.useInfiniteQuery(
    { programId: program.id, limit: 25 },
    {
      getNextPageParam: (lastPage: { nextCursor?: string }) =>
        lastPage.nextCursor,
    },
  );

  const redeemMutation = api.loyalty.redeemReward.useMutation({
    onSuccess: () => {
      toast({
        title: t("loyalty.rewardRedeemed"),
        description: t("loyalty.rewardRedeemedDescription"),
      });
      void refetchCards();
      void onRefetchPrograms();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleRedeem = useCallback(
    (cardId: string) => {
      if (window.confirm(t("loyalty.redeemConfirm"))) {
        redeemMutation.mutate({ cardId });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [redeemMutation.mutate, t],
  );

  const allCards: LoyaltyCard[] =
    cardsData?.pages.flatMap(
      (page: { cards: LoyaltyCard[] }) => page.cards,
    ) ?? [];

  const redemptionRate =
    stats && stats.totalCards > 0
      ? Math.round((stats.redemptions / stats.totalCards) * 100)
      : 0;

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`${program.icon} ${program.name}`}
        text={program.rewardDescription}
      >
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.backButton")}
        </Button>
      </DashboardHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t("loyalty.stats.totalCards")}
          value={statsLoading ? null : stats?.totalCards}
          color={program.color ?? "#6366f1"}
        />
        <StatCard
          icon={<Stamp className="h-4 w-4" />}
          label={t("loyalty.stats.totalStamps")}
          value={statsLoading ? null : stats?.totalStamps}
          color={program.color ?? "#6366f1"}
        />
        <StatCard
          icon={<Gift className="h-4 w-4" />}
          label={t("loyalty.stats.redemptions")}
          value={statsLoading ? null : stats?.redemptions}
          color={program.color ?? "#6366f1"}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t("loyalty.stats.redemptionRate")}
          value={statsLoading ? null : `${redemptionRate}%`}
          color={program.color ?? "#6366f1"}
        />
      </div>

      {cardsLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border p-4"
            >
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 ml-auto" />
            </div>
          ))}
        </div>
      )}
      {!cardsLoading && allCards.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {t("loyalty.noCards")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("loyalty.noCardsDescription")}
          </p>
        </div>
      )}
      {!cardsLoading && allCards.length > 0 && (
        <div className="space-y-2">
          <div className="hidden sm:grid sm:grid-cols-5 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
            <span>{t("loyalty.customer")}</span>
            <span>{t("loyalty.progress")}</span>
            <span>{t("loyalty.stamps")}</span>
            <span>{t("loyalty.lastActivity")}</span>
            <span className="text-right">{t("loyalty.actions")}</span>
          </div>

          {allCards.map((card: LoyaltyCard) => {
            const progress = Math.min(
              (card.stampsCollected / program.stampsRequired) * 100,
              100,
            );
            const canRedeem =
              card.stampsCollected >= program.stampsRequired &&
              !card.isRedeemed;

            return (
              <div
                key={card.id}
                className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2 sm:gap-4 rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="font-medium">{card.customerIdentifier}</div>

                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: program.color ?? "#6366f1",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  {t("loyalty.stampsCollected", {
                    collected: card.stampsCollected,
                    required: program.stampsRequired,
                  })}
                </div>

                <div className="text-sm text-muted-foreground">
                  {new Date(card.updatedAt).toLocaleDateString()}
                </div>

                <div className="flex items-center justify-end gap-2">
                  {card.isRedeemed && (
                    <Badge variant="secondary">
                      <Check className="mr-1 h-3 w-3" />
                      {t("loyalty.redeemed")}
                    </Badge>
                  )}
                  {!card.isRedeemed && canRedeem && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRedeem(card.id)}
                      loading={redeemMutation.isLoading}
                    >
                      <Gift className="mr-1.5 h-3.5 w-3.5" />
                      {t("loyalty.redeem")}
                    </Button>
                  )}
                  {!card.isRedeemed && !canRedeem && (
                    <Badge variant="outline">{t("loyalty.notRedeemed")}</Badge>
                  )}
                </div>
              </div>
            );
          })}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => void fetchNextPage()}
                loading={isFetchingNextPage}
              >
                {t("loyalty.loadMore")}
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | null | undefined;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      {value === null || value === undefined ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1 text-2xl font-bold">{value}</p>
      )}
    </div>
  );
}
