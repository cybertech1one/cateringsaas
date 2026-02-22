"use client";

import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import { LocationCard } from "./LocationCard";
import { MapPin, Plus } from "lucide-react";

// Lazy-load dialog - only rendered when user clicks "Add Location"
const CreateLocationDialog = dynamic(
  () => import("./CreateLocationDialog").then((mod) => ({ default: mod.CreateLocationDialog })),
  { ssr: false },
);

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

interface RestaurantLocationsTabProps {
  locations: Location[];
  restaurantId: string;
  createLocationOpen: boolean;
  onCreateLocationOpenChange: (open: boolean) => void;
  onDeleteLocation: (locationId: string) => void;
}

export function RestaurantLocationsTab({
  locations,
  restaurantId,
  createLocationOpen,
  onCreateLocationOpenChange,
  onDeleteLocation,
}: RestaurantLocationsTabProps) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Locations</h2>
        <Button
          className="rounded-full px-6 shadow-sm"
          onClick={() => onCreateLocationOpenChange(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      {locations.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              restaurantId={restaurantId}
              onDelete={onDeleteLocation}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 py-16">
          <MapPin className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No locations yet</h3>
          <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
            Add your first restaurant location to start managing multiple
            branches.
          </p>
          <Button
            className="mt-4 rounded-full"
            onClick={() => onCreateLocationOpenChange(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>
      )}

      <CreateLocationDialog
        restaurantId={restaurantId}
        open={createLocationOpen}
        onOpenChange={onCreateLocationOpenChange}
      />
    </>
  );
}
