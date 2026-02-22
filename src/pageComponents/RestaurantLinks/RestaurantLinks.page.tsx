"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  UtensilsCrossed,
  MessageCircle,
  Star,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { api } from "~/trpc/react";
import { shimmerToBase64 } from "~/utils/shimmer";
import { Skeleton } from "~/components/ui/skeleton";

// ── SVG Brand Icons (no external deps) ────────────────────────

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Opening Hours Parser ──────────────────────────────────────

interface DayHours {
  open: string;
  close: string;
}

type OpeningHoursMap = Record<string, DayHours | null>;

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function parseOpeningHours(json: unknown): OpeningHoursMap | null {
  if (!json || typeof json !== "object") return null;

  const hours = json as Record<string, unknown>;
  const result: OpeningHoursMap = {};
  let hasAny = false;

  for (const day of DAY_NAMES) {
    const dayData = hours[day];

    if (dayData && typeof dayData === "object") {
      const d = dayData as Record<string, unknown>;

      if (typeof d.open === "string" && typeof d.close === "string") {
        result[day] = { open: d.open, close: d.close };
        hasAny = true;
      } else {
        result[day] = null;
      }
    } else {
      result[day] = null;
    }
  }

  return hasAny ? result : null;
}

// ── Link Button Component ─────────────────────────────────────

function LinkButton({
  href,
  icon,
  label,
  sublabel,
  color,
  external = true,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  external?: boolean;
}) {
  const Component = external ? "a" : Link;
  const extraProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
    : {};

  return (
    <Component
      href={href}
      {...extraProps}
      className="group flex w-full items-center gap-4 rounded-2xl border border-border/50 bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sublabel && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {sublabel}
          </p>
        )}
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
    </Component>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────

function LinktreeSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-5 py-12">
      <Skeleton className="mb-4 h-24 w-24 rounded-full" />
      <Skeleton className="mb-2 h-7 w-48" />
      <Skeleton className="mb-8 h-4 w-32" />
      <div className="flex w-full flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────

export const RestaurantLinksPage = ({
  params: { slug },
}: {
  params: { slug: string };
}) => {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  const { data, isLoading, error } = api.menus.getPublicMenuBySlug.useQuery(
    { slug },
    { staleTime: 60_000, retry: 1 },
  );

  if (isLoading) return <LinktreeSkeleton />;
  if (error || !data) return notFound();
  if (!data.isPublished) return notFound();

  const openingHours = parseOpeningHours(data.openingHours);
  const addressParts = [data.address, data.city].filter(Boolean).join(", ");

  // Build links array
  const links: Array<{
    href: string;
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    color: string;
    external?: boolean;
  }> = [];

  // Menu link (always first)
  links.push({
    href: `/menu/${slug}`,
    icon: <UtensilsCrossed className="h-5 w-5 text-white" />,
    label: t("linktree.viewMenu"),
    sublabel: data.name,
    color: "hsl(var(--primary))",
    external: false,
  });

  // WhatsApp
  if (data.whatsappNumber) {
    const waNumber = data.whatsappNumber.replace(/[^0-9+]/g, "");

    links.push({
      href: `https://wa.me/${waNumber}`,
      icon: <WhatsAppIcon className="h-5 w-5 text-white" />,
      label: t("linktree.whatsapp"),
      sublabel: data.whatsappNumber,
      color: "#25D366",
    });
  }

  // Phone
  if (data.phone ?? data.contactNumber) {
    const phoneNumber = data.phone ?? data.contactNumber!;

    links.push({
      href: `tel:${phoneNumber}`,
      icon: <Phone className="h-5 w-5 text-white" />,
      label: t("linktree.callUs"),
      sublabel: phoneNumber,
      color: "#3B82F6",
    });
  }

  // Instagram
  if (data.instagramUrl) {
    links.push({
      href: data.instagramUrl,
      icon: <InstagramIcon className="h-5 w-5 text-white" />,
      label: "Instagram",
      sublabel: t("linktree.followUs"),
      color: "#E4405F",
    });
  }

  // Facebook
  if (data.facebookUrl) {
    links.push({
      href: data.facebookUrl,
      icon: <FacebookIcon className="h-5 w-5 text-white" />,
      label: "Facebook",
      sublabel: t("linktree.followUs"),
      color: "#1877F2",
    });
  }

  // Google Reviews
  if (data.googleReviewUrl) {
    links.push({
      href: data.googleReviewUrl,
      icon: <GoogleIcon className="h-5 w-5 text-white" />,
      label: t("linktree.leaveReview"),
      sublabel: data.rating
        ? `${Number(data.rating).toFixed(1)} ${t("linktree.stars")}`
        : undefined,
      color: "#EA4335",
    });
  }

  // Website
  if (data.website) {
    links.push({
      href: data.website,
      icon: <Globe className="h-5 w-5 text-white" />,
      label: t("linktree.website"),
      sublabel: data.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
      color: "#6366F1",
    });
  }

  // Directions
  if (addressParts) {
    links.push({
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts)}`,
      icon: <MapPin className="h-5 w-5 text-white" />,
      label: t("linktree.getDirections"),
      sublabel: addressParts,
      color: "#10B981",
    });
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background image overlay */}
      {data.backgroundImageUrl && (
        <div className="fixed inset-0 -z-10">
          <Image
            src={data.backgroundImageUrl}
            fill
            alt=""
            className="object-cover opacity-[0.04]"
            sizes="100vw"
            priority
          />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-md flex-col items-center px-5 py-12">
        {/* Avatar / Logo */}
        <div className="relative mb-5">
          {data.logoImageUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background shadow-lg">
              <Image
                src={data.logoImageUrl}
                fill
                alt={data.name}
                className="object-cover"
                sizes="96px"
                priority
                placeholder="blur"
                blurDataURL={shimmerToBase64(96, 96)}
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-primary shadow-lg">
              <span className="text-3xl font-bold text-primary-foreground">
                {data.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Verified badge (if featured) */}
          {data.isFeatured && (
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary shadow-sm">
              <Star className="h-3.5 w-3.5 fill-primary-foreground text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Restaurant Name */}
        <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-foreground">
          {data.name}
        </h1>

        {/* Address */}
        {addressParts && (
          <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {addressParts}
          </p>
        )}

        {/* Rating */}
        {data.rating && Number(data.rating) > 0 && (
          <div className="mb-6 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.round(Number(data.rating))
                      ? "fill-gold text-gold"
                      : "fill-none text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {Number(data.rating).toFixed(1)}
              {data.reviewCount && data.reviewCount > 0
                ? ` (${data.reviewCount})`
                : ""}
            </span>
          </div>
        )}

        {!data.rating && <div className="mb-6" />}

        {/* Links */}
        <div className="flex w-full flex-col gap-3">
          {links.map((link, i) => (
            <LinkButton
              key={i}
              href={link.href}
              icon={link.icon}
              label={link.label}
              sublabel={link.sublabel}
              color={link.color}
              external={link.external ?? true}
            />
          ))}
        </div>

        {/* Opening Hours */}
        {openingHours && (
          <div className="mt-8 w-full rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                {t("linktree.openingHours")}
              </h2>
            </div>
            <div className="space-y-1.5">
              {DAY_NAMES.map((day) => {
                const hours = openingHours[day];

                return (
                  <div
                    key={day}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {DAY_LABELS[day]}
                    </span>
                    {hours ? (
                      <span className="font-medium text-foreground">
                        {hours.open} - {hours.close}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">
                        {t("linktree.closed")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WhatsApp Chat CTA */}
        {data.whatsappNumber && (
          <a
            href={`https://wa.me/${data.whatsappNumber.replace(/[^0-9+]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
            {t("linktree.chatOnWhatsApp")}
          </a>
        )}

        {/* Powered by FeastQR */}
        <div className="mt-10 flex items-center gap-1.5 text-xs text-muted-foreground/50">
          <span>Powered by</span>
          <a
            href={process.env.NEXT_PUBLIC_APP_URL ?? "https://www.feastqr.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary/60 transition-colors hover:text-primary"
          >
            FeastQR
          </a>
        </div>
      </div>
    </div>
  );
};
