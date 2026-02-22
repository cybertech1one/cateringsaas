"use client";

import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/utils/cn";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface PricingSuggestion {
  lowPrice: number | null;
  highPrice: number | null;
  suggestedPrice: number | null;
  confidence: "low" | "medium" | "high";
  reasoning: string;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
}

// ---------------------------------------------------------------------------
// AIButton -- shared small AI action button
// ---------------------------------------------------------------------------

export interface AIButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  icon: React.ElementType;
  label: string;
  tooltip?: string;
  className?: string;
}

export function AIButton({
  onClick,
  loading,
  disabled,
  icon: Icon,
  label,
  tooltip,
  className,
}: AIButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700",
        "hover:from-violet-500/20 hover:to-purple-500/20 hover:shadow-sm",
        "dark:text-violet-300",
        className,
      )}
      title={tooltip ?? label}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
