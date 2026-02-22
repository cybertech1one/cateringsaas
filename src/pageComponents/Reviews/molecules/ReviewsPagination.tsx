"use client";

import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface ReviewsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// ── Component ────────────────────────────────────────────────

export function ReviewsPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: ReviewsPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {t("reviews.showingResults", {
          from: currentPage * pageSize + 1,
          to: Math.min((currentPage + 1) * pageSize, totalCount),
          total: totalCount,
        })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={currentPage === 0}
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("reviews.previous")}
        </Button>
        <span className="text-sm font-medium">
          {currentPage + 1} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={currentPage >= totalPages - 1}
          onClick={() =>
            onPageChange(Math.min(totalPages - 1, currentPage + 1))
          }
        >
          {t("reviews.next")}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
