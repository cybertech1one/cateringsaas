"use client";

import { Badge } from "~/components/ui/badge";
import { Tag, Calendar } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  isActive: boolean;
}

interface RestaurantPromotionsTabProps {
  promotions: Promotion[];
}

export function RestaurantPromotionsTab({
  promotions,
}: RestaurantPromotionsTabProps) {
  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Promotions</h2>
        <p className="text-sm text-muted-foreground">
          Manage active and upcoming promotions
        </p>
      </div>

      {promotions.length ? (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{promo.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {promo.description ?? "No description"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {promo.startDate && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(promo.startDate).toLocaleDateString()}
                    {promo.endDate &&
                      ` - ${new Date(promo.endDate).toLocaleDateString()}`}
                  </span>
                )}
                <Badge
                  variant={promo.isActive ? "default" : "secondary"}
                >
                  {promo.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 py-16">
          <Tag className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No promotions</h3>
          <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
            Promotions will appear here once they are created for this
            restaurant.
          </p>
        </div>
      )}
    </>
  );
}
