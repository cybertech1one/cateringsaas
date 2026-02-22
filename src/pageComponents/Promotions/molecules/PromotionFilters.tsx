"use client";

import { Button } from "~/components/ui/button";
import {
  type FilterStatus,
  type Promotion,
  getPromotionStatus,
  capitalize,
} from "../types";

// ── Types ────────────────────────────────────────────────────

interface PromotionFiltersProps {
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  promotions: Promotion[] | undefined;
}

// ── Constants ────────────────────────────────────────────────

const FILTER_STATUSES: FilterStatus[] = [
  "all",
  "active",
  "scheduled",
  "expired",
];

// ── Component ────────────────────────────────────────────────

export function PromotionFilters({
  filterStatus,
  onFilterChange,
  promotions,
}: PromotionFiltersProps) {
  return (
    <div className="flex gap-1.5 rounded-lg bg-muted/30 p-1">
      {FILTER_STATUSES.map((status) => (
        <Button
          key={status}
          variant={filterStatus === status ? "default" : "ghost"}
          size="sm"
          className={`rounded-md ${filterStatus === status ? "shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => onFilterChange(status)}
        >
          {capitalize(status)}
          {promotions && status !== "all" && (
            <span className="ml-1.5 rounded-full bg-background/60 px-1.5 text-[10px] font-semibold tabular-nums">
              {
                promotions.filter(
                  (p: unknown) =>
                    getPromotionStatus(p as Promotion) === status,
                ).length
              }
            </span>
          )}
          {promotions && status === "all" && (
            <span className="ml-1.5 rounded-full bg-background/60 px-1.5 text-[10px] font-semibold tabular-nums">
              {promotions.length}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
