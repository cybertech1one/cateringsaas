"use client";

import Image from "next/image";
import { User, Bike, Car, Truck as Van, Footprints, MessageCircle, Phone } from "lucide-react";
import { shimmerToBase64 } from "~/utils/shimmer";

interface DeliveryDriverCardProps {
  fullName: string;
  phone: string | null;
  vehicleType: string | null;
  profilePhotoUrl: string | null;
  rating: number | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const VEHICLE_ICONS: Record<string, React.ReactNode> = {
  bicycle: <Bike className="h-4 w-4" />,
  motorcycle: <Bike className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  van: <Van className="h-4 w-4" />,
  on_foot: <Footprints className="h-4 w-4" />,
};

export function DeliveryDriverCard({
  fullName,
  phone,
  vehicleType,
  profilePhotoUrl,
  rating,
  t,
}: DeliveryDriverCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card px-5 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("deliveryTracking.driverInfo")}
      </p>
      <div className="flex items-center gap-3">
        {/* Driver avatar */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
          {profilePhotoUrl ? (
            <Image
              src={profilePhotoUrl}
              fill
              alt={fullName}
              className="object-cover"
              sizes="48px"
              placeholder="blur"
              blurDataURL={shimmerToBase64(48, 48)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Driver info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{fullName}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {vehicleType && (
              <span className="inline-flex items-center gap-1">
                {VEHICLE_ICONS[vehicleType] ?? null}
                {t(`deliveryTracking.vehicleType.${vehicleType}`)}
              </span>
            )}
            {rating !== null && (
              <span className="inline-flex items-center gap-0.5">
                <svg
                  className="h-3 w-3 fill-yellow-400 text-yellow-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact buttons */}
      {phone && (
        <div className="mt-3 flex gap-2">
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {t("deliveryTracking.whatsappDriver")}
          </a>
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
