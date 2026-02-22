"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { MessageSquare } from "lucide-react";
import { type Review } from "./molecules/ReviewCard";
import { ReviewCard } from "./molecules/ReviewCard";
import {
  ReviewStatsCards,
  RatingDistribution,
  StatsSkeletons,
} from "./molecules/ReviewStats";
import {
  ReputationOverview,
  ReputationOverviewSkeleton,
} from "./molecules/ReputationOverview";
import { MenuSelector, StatusFilter } from "./molecules/ReviewFilters";
import dynamic from "next/dynamic";

// Lazy-load delete confirmation dialog - only shown when user clicks delete
const DeleteReviewDialog = dynamic(
  () => import("./molecules/DeleteReviewDialog").then((mod) => ({ default: mod.DeleteReviewDialog })),
  { ssr: false },
);

import { ReviewsPagination } from "./molecules/ReviewsPagination";
import { ReviewsListSkeleton } from "./molecules/ReviewsListSkeleton";
import { useToast } from "~/components/ui/use-toast";

// ── Constants ────────────────────────────────────────────────

type ReviewStatus = "pending" | "approved" | "rejected";

const REVIEWS_PER_PAGE = 10;

// ── Component ────────────────────────────────────────────────

export function ReviewsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── State ────────────────────────────────────────────────
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────
  const { data: menus, isLoading: menusLoading } =
    api.menus.getMenus.useQuery();

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = api.reviews.getMenuReviews.useQuery(
    {
      menuId: selectedMenuId,
      ...(statusFilter !== "all"
        ? { status: statusFilter as ReviewStatus }
        : {}),
      limit: REVIEWS_PER_PAGE,
      offset: currentPage * REVIEWS_PER_PAGE,
    },
    { enabled: !!selectedMenuId },
  );

  const { data: stats, isLoading: statsLoading } =
    api.reviews.getReviewStats.useQuery(
      { menuId: selectedMenuId },
      { enabled: !!selectedMenuId },
    );

  const { data: reputationData, isLoading: reputationLoading } =
    api.reviews.getReputationStats.useQuery(
      { menuId: selectedMenuId },
      { enabled: !!selectedMenuId },
    );

  // ── Mutations ────────────────────────────────────────────
  const moderateMutation = api.reviews.moderateReview.useMutation({
    onSuccess: () => {
      toast({ title: t("reviews.reviewModerated") });
      void refetchReviews();
    },
    onError: () => {
      toast({
        title: t("reviews.moderationFailed"),
        variant: "destructive",
      });
    },
  });

  const respondMutation = api.reviews.respondToReview.useMutation({
    onSuccess: () => {
      toast({ title: t("reviews.responseSent") });
      setReplyingToId(null);
      setReplyText("");
      void refetchReviews();
    },
    onError: () => {
      toast({
        title: t("reviews.responseFailed"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.reviews.deleteReview.useMutation({
    onSuccess: () => {
      toast({ title: t("reviews.reviewDeleted") });
      setDeleteDialogOpen(false);
      setDeletingReviewId(null);
      void refetchReviews();
    },
    onError: () => {
      toast({
        title: t("reviews.deleteFailed"),
        variant: "destructive",
      });
    },
  });

  // ── Handlers ─────────────────────────────────────────────
  const handleModerate = useCallback(
    (reviewId: string, status: "approved" | "rejected") => {
      moderateMutation.mutate({ reviewId, status });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moderateMutation.mutate],
  );

  const handleReply = useCallback(
    (reviewId: string) => {
      if (!replyText.trim()) return;
      respondMutation.mutate({ reviewId, response: replyText.trim() });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replyText, respondMutation.mutate],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingReviewId) return;
    deleteMutation.mutate({ reviewId: deletingReviewId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletingReviewId, deleteMutation.mutate]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeletingReviewId(null);
  }, []);

  const openDeleteDialog = useCallback((reviewId: string) => {
    setDeletingReviewId(reviewId);
    setDeleteDialogOpen(true);
  }, []);

  const handleStartReply = useCallback(
    (reviewId: string, existingResponse: string | null) => {
      setReplyingToId(reviewId);
      setReplyText(existingResponse ?? "");
    },
    [],
  );

  const handleCancelReply = useCallback(() => {
    setReplyingToId(null);
    setReplyText("");
  }, []);

  const handleMenuChange = useCallback((menuId: string) => {
    setSelectedMenuId(menuId);
    setCurrentPage(0);
  }, []);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(0);
  }, []);

  const formatDate = useCallback((date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;

    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // ── Derived values ───────────────────────────────────────
  const reviews: Review[] = reviewsData?.reviews ?? [];
  const totalCount: number = reviewsData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / REVIEWS_PER_PAGE);

  // ── Render ───────────────────────────────────────────────
  if (menusLoading) return <LoadingScreen />;

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Header with gradient icon badge */}
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-gold shadow-sm">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("reviews.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("reviews.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Menu selector in section card */}
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <MenuSelector
            menus={menus ?? []}
            selectedMenuId={selectedMenuId}
            onMenuChange={handleMenuChange}
          />
        </div>

        {/* Reputation overview */}
        {selectedMenuId && reputationLoading && <ReputationOverviewSkeleton />}
        {selectedMenuId && reputationData && (
          <ReputationOverview data={reputationData} />
        )}

        {/* Stats cards */}
        {selectedMenuId && statsLoading && <StatsSkeletons />}
        {selectedMenuId && stats && <ReviewStatsCards stats={stats} />}

        {/* Rating distribution */}
        {selectedMenuId && stats && stats.ratingDistribution && (
          <RatingDistribution stats={stats} />
        )}

        {/* Status filter tabs */}
        {selectedMenuId && (
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <StatusFilter
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
            />
          </div>
        )}

        {/* Reviews list */}
        {selectedMenuId && reviewsLoading && <ReviewsListSkeleton />}
        {selectedMenuId && !reviewsLoading && (
          <div>
            {reviews.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-amber-500/5 via-transparent to-gold/5 py-16">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-gold/5 blur-2xl" />
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-gold/10">
                    <MessageSquare className="h-8 w-8 text-amber-500/60" />
                  </div>
                  <h3 className="text-center font-display text-lg font-semibold">
                    {t("reviews.noReviews")}
                  </h3>
                  <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
                    {t("reviews.noReviewsDescription")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    replyingToId={replyingToId}
                    replyText={replyText}
                    onReplyTextChange={setReplyText}
                    onStartReply={handleStartReply}
                    onCancelReply={handleCancelReply}
                    onSendReply={handleReply}
                    onModerate={handleModerate}
                    onDelete={openDeleteDialog}
                    isModerateLoading={moderateMutation.isLoading}
                    isRespondLoading={respondMutation.isLoading}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {selectedMenuId && !reviewsLoading && (
          <div className="rounded-2xl border border-border/50 bg-card px-5 py-4">
            <ReviewsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={REVIEWS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </DashboardShell>

      {/* Delete confirmation dialog */}
      <DeleteReviewDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteMutation.isLoading}
      />
    </main>
  );
}
