"use client";

import { memo } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  MapPin,
  Phone,
  Mail,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean | null;
}

interface LocationCardProps {
  location: Location;
  restaurantId: string;
  onDelete: (locationId: string) => void;
}

export const LocationCard = memo(function LocationCard({
  location,
  restaurantId,
  onDelete,
}: LocationCardProps) {
  const addressParts = [location.address, location.city, location.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base font-semibold text-foreground">
              {location.name}
            </h3>
            <Badge
              variant={location.isActive ? "default" : "secondary"}
              className="flex-shrink-0"
            >
              {location.isActive ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Inactive
                </span>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-2">
        {addressParts && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {addressParts}
              {location.postalCode && ` ${location.postalCode}`}
              {location.country && `, ${location.country}`}
            </span>
          </div>
        )}
        {location.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{location.phone}</span>
          </div>
        )}
        {location.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{location.email}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-border/30 pt-3">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link
            href={`/dashboard/restaurants/${restaurantId}/locations/${location.id}`}
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(location.id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});
