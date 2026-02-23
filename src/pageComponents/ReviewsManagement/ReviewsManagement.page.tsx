"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Star,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowUpDown,
  Send,
  Award,
  Users,
  ThumbsUp,
  Eye,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Filter,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  "wedding",
  "corporate",
  "ramadan_iftar",
  "eid",
  "birthday",
  "conference",
  "funeral",
  "engagement",
  "henna",
  "graduation",
  "diffa",
  "other",
] as const;

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Wedding",
  corporate: "Corporate",
  ramadan_iftar: "Ramadan Iftar",
  eid: "Eid",
  birthday: "Birthday",
  conference: "Conference",
  funeral: "Funeral",
  engagement: "Engagement",
  henna: "Henna",
  graduation: "Graduation",
  diffa: "Diffa",
  other: "Other",
};

type SortOption = "newest" | "highest" | "lowest";
type FilterTab = "all" | "pending" | "responded" | "approved" | "rejected";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= rating
              ? "fill-gold text-gold"
              : "fill-muted text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function RatingBar({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-muted-foreground">{stars}</span>
      <Star className="h-3 w-3 fill-gold text-gold" />
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gold transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReviewsManagement() {
  const { toast } = useToast();
  const apiContext = api.useContext();

  // ── State ──────────────────────────────────────────────────────────────
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false);
  const [moderateAction, setModerateAction] = useState<"approved" | "rejected">("approved");

  // ── Queries ────────────────────────────────────────────────────────────
  const statusFilter = useMemo(() => {
    if (filterTab === "all" || filterTab === "responded") return undefined;
    if (filterTab === "pending") return "pending" as const;
    if (filterTab === "approved") return "approved" as const;
    if (filterTab === "rejected") return "rejected" as const;
    return undefined;
  }, [filterTab]);

  const reviewsQuery = api.eventReviews.list.useQuery({
    status: statusFilter,
    limit: 50,
  });

  const statsQuery = api.eventReviews.getStats.useQuery({});

  // ── Mutations ──────────────────────────────────────────────────────────
  const respondMutation = api.eventReviews.respond.useMutation({
    onSuccess: () => {
      toast({ title: "Response sent", description: "Your reply has been published." });
      setRespondDialogOpen(false);
      setResponseText("");
      setSelectedReviewId(null);
      void apiContext.eventReviews.list.invalidate();
      void apiContext.eventReviews.getStats.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const moderateMutation = api.eventReviews.moderate.useMutation({
    onSuccess: () => {
      toast({
        title: moderateAction === "approved" ? "Review approved" : "Review rejected",
        description:
          moderateAction === "approved"
            ? "The review is now published."
            : "The review has been rejected.",
      });
      setModerateDialogOpen(false);
      setSelectedReviewId(null);
      void apiContext.eventReviews.list.invalidate();
      void apiContext.eventReviews.getStats.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleFeaturedMutation = api.eventReviews.toggleFeatured.useMutation({
    onSuccess: () => {
      toast({ title: "Updated", description: "Featured status toggled." });
      void apiContext.eventReviews.list.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ── Derived data ───────────────────────────────────────────────────────
  const reviews = reviewsQuery.data?.reviews ?? [];
  const stats = statsQuery.data;

  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Filter by "responded" tab (reviews that have a response)
    if (filterTab === "responded") {
      filtered = filtered.filter((r) => r.response !== null && r.response !== undefined);
    }

    // Filter by event type
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((r) => r.eventType === eventTypeFilter);
    }

    // Sort
    switch (sortBy) {
      case "highest":
        filtered.sort((a, b) => b.ratingOverall - a.ratingOverall);
        break;
      case "lowest":
        filtered.sort((a, b) => a.ratingOverall - b.ratingOverall);
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return filtered;
  }, [reviews, filterTab, eventTypeFilter, sortBy]);

  const selectedReview = useMemo(
    () => reviews.find((r) => r.id === selectedReviewId) ?? null,
    [reviews, selectedReviewId]
  );

  // ── Computed stats ─────────────────────────────────────────────────────
  const totalReviews = stats?.totalReviews ?? 0;
  const averageRating = stats?.averageRating ?? 0;
  const pendingCount = stats?.pendingCount ?? 0;
  const distribution = stats?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const fiveStarPct =
    totalReviews > 0
      ? Math.round(((distribution[5] ?? 0) / totalReviews) * 100)
      : 0;
  const respondedCount = reviews.filter(
    (r) => r.response !== null && r.response !== undefined
  ).length;
  const responseRate =
    reviews.length > 0 ? Math.round((respondedCount / reviews.length) * 100) : 0;

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleRespond = useCallback(() => {
    if (!selectedReviewId || !responseText.trim()) return;
    respondMutation.mutate({
      reviewId: selectedReviewId,
      response: responseText.trim(),
    });
  }, [selectedReviewId, responseText, respondMutation]);

  const handleModerate = useCallback(() => {
    if (!selectedReviewId) return;
    moderateMutation.mutate({
      reviewId: selectedReviewId,
      status: moderateAction,
    });
  }, [selectedReviewId, moderateAction, moderateMutation]);

  const openRespondDialog = useCallback(
    (reviewId: string) => {
      const review = reviews.find((r) => r.id === reviewId);
      setSelectedReviewId(reviewId);
      setResponseText(review?.response ?? "");
      setRespondDialogOpen(true);
    },
    [reviews]
  );

  const openModerateDialog = useCallback(
    (reviewId: string, action: "approved" | "rejected") => {
      setSelectedReviewId(reviewId);
      setModerateAction(action);
      setModerateDialogOpen(true);
    },
    []
  );

  // ── Loading state ──────────────────────────────────────────────────────
  if (reviewsQuery.isLoading || statsQuery.isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <DashboardPageHeader
        title="Reviews"
        description="Manage client feedback and build your reputation"
        icon={<Star className="h-5 w-5" />}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Average Rating */}
        <Card className="arch-card-top">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Average Rating
              </span>
              <TrendingUp className="h-4 w-4 text-gold" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {averageRating.toFixed(1)}
              </span>
              <StarRating rating={Math.round(averageRating)} size="sm" />
            </div>
          </CardContent>
        </Card>

        {/* Total Reviews */}
        <Card className="arch-card-top">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total Reviews
              </span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-foreground">
                {totalReviews}
              </span>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card className="arch-card-top">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Response Rate
              </span>
              <MessageSquare className="h-4 w-4 text-sage" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-foreground">
                {responseRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 5-Star Percentage */}
        <Card className="arch-card-top">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                5-Star Reviews
              </span>
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-foreground">
                {fiveStarPct}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Rating Distribution</h3>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <RatingBar
                  key={stars}
                  stars={stars}
                  count={(distribution as Record<number, number>)[stars] ?? 0}
                  total={totalReviews}
                />
              ))}
            </div>

            {/* Dimension Averages */}
            {stats?.dimensions && (
              <div className="mt-6 pt-4 border-t space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                  Dimension Averages
                </h4>
                {[
                  { label: "Food Quality", value: stats.dimensions.foodQuality },
                  { label: "Presentation", value: stats.dimensions.presentation },
                  { label: "Service", value: stats.dimensions.serviceStaff },
                  { label: "Punctuality", value: stats.dimensions.punctuality },
                  { label: "Value", value: stats.dimensions.valueForMoney },
                  { label: "Communication", value: stats.dimensions.communication },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">
                        {(value as number).toFixed(1)}
                      </span>
                      <Star className="h-3 w-3 fill-gold text-gold" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Tabs
              value={filterTab}
              onValueChange={(v) => setFilterTab(v as FilterTab)}
            >
              <TabsList>
                <TabsTrigger value="all">
                  All ({reviews.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({reviews.filter((r) => r.status === "pending").length})
                </TabsTrigger>
                <TabsTrigger value="responded">
                  Responded ({respondedCount})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Published
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EVENT_TYPE_LABELS[type] ?? type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="w-[150px] h-9">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="highest">Highest Rated</SelectItem>
                  <SelectItem value="lowest">Lowest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Review Cards */}
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <h3 className="font-semibold text-lg">No reviews found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {filterTab === "pending"
                    ? "No reviews are awaiting moderation."
                    : "Adjust your filters to see reviews."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review) => (
                <Card
                  key={review.id}
                  className={cn(
                    "transition-shadow hover:shadow-md",
                    review.status === "pending" && "border-l-4 border-l-gold",
                    review.isFeatured && "ring-1 ring-gold/30"
                  )}
                >
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {review.reviewerName}
                          </span>
                          {review.isVerified && (
                            <Badge
                              variant="outline"
                              className="text-xs gap-1 border-sage/30 text-sage"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                          {review.isFeatured && (
                            <Badge
                              variant="outline"
                              className="text-xs gap-1 border-gold/30 text-gold"
                            >
                              <Award className="h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                          <Badge
                            variant={
                              review.status === "approved"
                                ? "default"
                                : review.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs capitalize"
                          >
                            {review.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {review.eventType && (
                            <span>
                              {EVENT_TYPE_LABELS[review.eventType] ??
                                review.eventType}
                            </span>
                          )}
                          {review.eventDate && (
                            <span>{formatDate(review.eventDate)}</span>
                          )}
                          {review.guestCount && (
                            <span>{review.guestCount} guests</span>
                          )}
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      <StarRating rating={review.ratingOverall} size="md" />
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {/* Sub-ratings */}
                    {(review.ratingFoodQuality ||
                      review.ratingPresentation ||
                      review.ratingServiceStaff) && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {review.ratingFoodQuality && (
                          <span>
                            Food: {review.ratingFoodQuality}/5
                          </span>
                        )}
                        {review.ratingPresentation && (
                          <span>
                            Presentation: {review.ratingPresentation}/5
                          </span>
                        )}
                        {review.ratingServiceStaff && (
                          <span>
                            Service: {review.ratingServiceStaff}/5
                          </span>
                        )}
                        {review.ratingPunctuality && (
                          <span>
                            Punctuality: {review.ratingPunctuality}/5
                          </span>
                        )}
                        {review.ratingValueForMoney && (
                          <span>
                            Value: {review.ratingValueForMoney}/5
                          </span>
                        )}
                        {review.ratingCommunication && (
                          <span>
                            Communication: {review.ratingCommunication}/5
                          </span>
                        )}
                      </div>
                    )}

                    {/* Existing Response */}
                    {review.response && (
                      <div className="mt-3 rounded-lg bg-muted/50 p-3 border-l-2 border-primary/30">
                        <p className="text-xs font-medium text-primary mb-1">
                          Your Response
                        </p>
                        <p className="text-sm text-foreground/80">
                          {review.response}
                        </p>
                        {review.respondedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(review.respondedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => openRespondDialog(review.id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1.5" />
                        {review.response ? "Edit Reply" : "Reply"}
                      </Button>

                      {review.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-sage border-sage/30 hover:bg-sage/10"
                            onClick={() =>
                              openModerateDialog(review.id, "approved")
                            }
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() =>
                              openModerateDialog(review.id, "rejected")
                            }
                          >
                            <XCircle className="h-3 w-3 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      )}

                      {review.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 text-xs",
                            review.isFeatured && "text-gold"
                          )}
                          onClick={() =>
                            toggleFeaturedMutation.mutate({
                              reviewId: review.id,
                            })
                          }
                        >
                          <Award className="h-3 w-3 mr-1.5" />
                          {review.isFeatured ? "Unfeature" : "Feature"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.response ? "Edit Your Reply" : "Reply to Review"}
            </DialogTitle>
            <DialogDescription>
              {selectedReview && (
                <span className="flex items-center gap-2 mt-1">
                  <span className="font-medium text-foreground">
                    {selectedReview.reviewerName}
                  </span>
                  <StarRating rating={selectedReview.ratingOverall} size="sm" />
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedReview?.comment && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground/80 italic">
              &ldquo;{selectedReview.comment}&rdquo;
            </div>
          )}

          <Textarea
            placeholder="Write your response..."
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRespondDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={
                !responseText.trim() || respondMutation.isLoading
              }
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4 mr-1.5" />
              {respondMutation.isLoading ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderate Dialog */}
      <Dialog open={moderateDialogOpen} onOpenChange={setModerateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {moderateAction === "approved"
                ? "Approve Review"
                : "Reject Review"}
            </DialogTitle>
            <DialogDescription>
              {moderateAction === "approved"
                ? "This review will be published and visible to the public."
                : "This review will be hidden from public view."}
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {selectedReview.reviewerName}
                </span>
                <StarRating rating={selectedReview.ratingOverall} size="sm" />
              </div>
              {selectedReview.comment && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedReview.comment}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModerate}
              disabled={moderateMutation.isLoading}
              variant={moderateAction === "approved" ? "default" : "destructive"}
            >
              {moderateAction === "approved" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {moderateMutation.isLoading ? "Approving..." : "Approve"}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1.5" />
                  {moderateMutation.isLoading ? "Rejecting..." : "Reject"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
