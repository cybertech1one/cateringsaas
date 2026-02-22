"use client";

import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Plus, Image, Star } from "lucide-react";

const EVENT_TYPES = [
  "wedding",
  "corporate",
  "ramadan_iftar",
  "eid",
  "birthday",
  "engagement",
  "henna",
  "graduation",
  "diffa",
  "conference",
  "other",
];

type PortfolioImage = {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  eventType: string | null;
  eventDate: Date | null;
  isFeatured: boolean;
  sortOrder: number;
  orgId: string;
};

export default function PortfolioManagement() {
  const { data: images, isLoading } = api.portfolio.list.useQuery({});

  const items = (images ?? []) as PortfolioImage[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Showcase your best work to attract new clients
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Image
        </Button>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading portfolio...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Image className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">
            No portfolio images yet
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Add photos of your catering events to showcase on your marketplace
            profile
          </p>
          <Button variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Upload your first image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((img) => (
            <Card
              key={img.id}
              className="group overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {img.thumbnailUrl || img.imageUrl ? (
                  <img
                    src={img.thumbnailUrl ?? img.imageUrl}
                    alt={img.caption || "Portfolio image"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                {img.isFeatured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-amber-500 text-white text-[10px] gap-1">
                      <Star className="h-3 w-3" />
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                {img.caption && (
                  <p className="text-sm font-medium line-clamp-1">
                    {img.caption}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {img.eventType && (
                    <Badge variant="secondary" className="text-[10px]">
                      {img.eventType.replace(/_/g, " ")}
                    </Badge>
                  )}
                  {img.eventDate && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(img.eventDate).toLocaleDateString(
                        "fr-MA",
                        { month: "short", year: "numeric" }
                      )}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
