"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import {
  Plus,
  Image as ImageIcon,
  Star,
  Pencil,
  Trash2,
  MoreHorizontal,
  Camera,
  Sparkles,
  Calendar,
  Grid3X3,
  LayoutGrid,
  Eye,
  ImageOff,
  Upload,
  X,
  Search,
  ArrowUpDown,
  GripVertical,
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
  "engagement",
  "henna",
  "graduation",
  "diffa",
  "conference",
  "other",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

/** Display config for each event type */
const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  wedding: {
    label: "Wedding",
    color: "text-[hsl(var(--rose-petal))]",
    bgColor: "bg-[hsl(var(--rose-petal))]/10 border-[hsl(var(--rose-petal))]/20",
    icon: "ring",
  },
  corporate: {
    label: "Corporate",
    color: "text-[hsl(var(--chefchaouen))]",
    bgColor: "bg-[hsl(var(--chefchaouen))]/10 border-[hsl(var(--chefchaouen))]/20",
    icon: "building",
  },
  ramadan_iftar: {
    label: "Ramadan Iftar",
    color: "text-[hsl(var(--mint-tea))]",
    bgColor: "bg-[hsl(var(--mint-tea))]/10 border-[hsl(var(--mint-tea))]/20",
    icon: "moon",
  },
  eid: {
    label: "Eid",
    color: "text-gold",
    bgColor: "bg-gold/10 border-gold/20",
    icon: "star",
  },
  birthday: {
    label: "Birthday",
    color: "text-[hsl(var(--harissa))]",
    bgColor: "bg-[hsl(var(--harissa))]/10 border-[hsl(var(--harissa))]/20",
    icon: "cake",
  },
  engagement: {
    label: "Engagement",
    color: "text-terracotta",
    bgColor: "bg-terracotta/10 border-terracotta/20",
    icon: "heart",
  },
  henna: {
    label: "Henna",
    color: "text-[hsl(var(--saffron))]",
    bgColor: "bg-[hsl(var(--saffron))]/10 border-[hsl(var(--saffron))]/20",
    icon: "hand",
  },
  graduation: {
    label: "Graduation",
    color: "text-[hsl(var(--majorelle-blue))]",
    bgColor: "bg-[hsl(var(--majorelle-blue))]/10 border-[hsl(var(--majorelle-blue))]/20",
    icon: "cap",
  },
  diffa: {
    label: "Diffa",
    color: "text-[hsl(var(--zellige-teal))]",
    bgColor: "bg-[hsl(var(--zellige-teal))]/10 border-[hsl(var(--zellige-teal))]/20",
    icon: "palace",
  },
  conference: {
    label: "Conference",
    color: "text-[hsl(var(--majorelle-blue))]",
    bgColor: "bg-[hsl(var(--majorelle-blue))]/10 border-[hsl(var(--majorelle-blue))]/20",
    icon: "mic",
  },
  other: {
    label: "Other",
    color: "text-muted-foreground",
    bgColor: "bg-muted border-border",
    icon: "calendar",
  },
};

type SortOption = "newest" | "oldest" | "featured" | "event_type";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "featured", label: "Featured First" },
  { value: "event_type", label: "Event Type" },
];

type GridColumns = 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

type UploadFormData = {
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  eventType: string;
  eventDate: string;
  isFeatured: boolean;
};

const EMPTY_FORM: UploadFormData = {
  imageUrl: "",
  thumbnailUrl: "",
  caption: "",
  eventType: "",
  eventDate: "",
  isFeatured: false,
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function formatEventType(type: string): string {
  const config = EVENT_TYPE_CONFIG[type as EventType];
  return config?.label ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEventTypeStyle(type: string | null): { color: string; bgColor: string } {
  if (!type) return { color: "text-muted-foreground", bgColor: "bg-muted border-border" };
  const config = EVENT_TYPE_CONFIG[type as EventType];
  return config ?? { color: "text-muted-foreground", bgColor: "bg-muted border-border" };
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getUniqueEventTypes(images: PortfolioImage[]): string[] {
  const types = new Set<string>();
  for (const img of images) {
    if (img.eventType) types.add(img.eventType);
  }
  return Array.from(types).sort();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Stats card for the summary row */
function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              accent,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
      <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", accent)} />
    </Card>
  );
}

/** Loading skeleton for the gallery grid */
function GallerySkeletons({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Stats row skeleton */
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Beautiful empty state */
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      {/* Decorative background pattern */}
      <div className="relative mb-8">
        <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-primary/10 via-gold/10 to-terracotta/10 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-gold/10 border border-primary/15 shadow-sm">
          <Camera className="h-10 w-10 text-primary/70" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        Your portfolio is empty
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-2">
        Showcase your best catering work to attract new clients. Upload photos from
        weddings, corporate events, Ramadan iftars, and more.
      </p>
      <p className="text-xs text-muted-foreground/70 text-center max-w-sm mb-6">
        High-quality event photos help build trust and convert visitors into clients.
        Feature your best shots for maximum impact.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={onUpload}
          className="gap-2 bg-gradient-to-r from-primary to-terracotta hover:from-primary/90 hover:to-terracotta/90 text-white shadow-md"
          size="lg"
        >
          <Upload className="h-4 w-4" />
          Upload your first image
        </Button>
        <p className="text-xs text-muted-foreground">
          Supports JPG, PNG, WebP
        </p>
      </div>

      {/* Decorative grid hint */}
      <div className="mt-12 grid grid-cols-3 gap-3 opacity-20">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg border-2 border-dashed border-muted-foreground/30",
              i < 3 ? "h-20 w-24" : "h-16 w-24",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Single portfolio image card */
function PortfolioCard({
  image,
  onEdit,
  onDelete,
  onToggleFeatured,
  isTogglingFeatured,
}: {
  image: PortfolioImage;
  onEdit: (image: PortfolioImage) => void;
  onDelete: (image: PortfolioImage) => void;
  onToggleFeatured: (image: PortfolioImage) => void;
  isTogglingFeatured: boolean;
}) {
  const style = getEventTypeStyle(image.eventType);

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/5 hover:-translate-y-0.5 border-muted/60">
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {image.thumbnailUrl || image.imageUrl ? (
          <img
            src={image.thumbnailUrl ?? image.imageUrl}
            alt={image.caption || "Portfolio image"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <ImageOff className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {/* Caption overlay */}
          {image.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-sm font-medium text-white line-clamp-2">
                {image.caption}
              </p>
            </div>
          )}
        </div>

        {/* Top-left: Featured badge */}
        {image.isFeatured && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-gold/90 text-white text-[10px] gap-1 shadow-sm backdrop-blur-sm border-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              Featured
            </Badge>
          </div>
        )}

        {/* Top-right: Actions dropdown */}
        <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onToggleFeatured(image)} disabled={isTogglingFeatured}>
                <Star
                  className={cn(
                    "mr-2 h-4 w-4",
                    image.isFeatured
                      ? "fill-gold text-gold"
                      : "text-muted-foreground",
                  )}
                />
                {image.isFeatured ? "Remove Featured" : "Set as Featured"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(image)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(image.imageUrl, "_blank")}>
                <Eye className="mr-2 h-4 w-4" />
                View Full Size
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(image)}
                className="text-destructive focus:text-destructive focus:bg-destructive/5"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom-left: Quick featured toggle (star icon) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFeatured(image);
          }}
          disabled={isTogglingFeatured}
          className={cn(
            "absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
            "opacity-0 group-hover:opacity-100",
            image.isFeatured
              ? "bg-gold text-white shadow-md"
              : "bg-white/80 text-muted-foreground hover:bg-gold hover:text-white backdrop-blur-sm shadow-sm",
          )}
          aria-label={image.isFeatured ? "Remove from featured" : "Add to featured"}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-transform",
              image.isFeatured && "fill-current",
            )}
          />
        </button>
      </div>

      {/* Card metadata */}
      <CardContent className="p-3">
        {image.caption && (
          <p className="text-sm font-medium text-foreground line-clamp-1 mb-1.5">
            {image.caption}
          </p>
        )}
        {!image.caption && (
          <p className="text-sm text-muted-foreground/50 italic line-clamp-1 mb-1.5">
            No caption
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {image.eventType && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0 h-5 font-medium border",
                style.bgColor,
                style.color,
              )}
            >
              {formatEventType(image.eventType)}
            </Badge>
          )}
          {image.eventDate && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(image.eventDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Filter pill button */
function FilterPill({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-muted-foreground/30",
      )}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold",
            active ? "bg-white/25 text-white" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Image preview in dialog */
function ImagePreview({
  url,
  alt,
}: {
  url: string;
  alt: string;
}) {
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30">
        <div className="text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-1 text-xs text-muted-foreground/50">Enter an image URL above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted">
      <img
        src={url}
        alt={alt}
        className="h-40 w-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent) {
            parent.innerHTML =
              '<div class="flex h-40 items-center justify-center"><p class="text-xs text-red-500">Failed to load image</p></div>';
          }
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PortfolioManagement() {
  const { toast } = useToast();
  const utils = api.useContext();

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [gridCols, setGridCols] = useState<GridColumns>(3);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);
  const [formData, setFormData] = useState<UploadFormData>(EMPTY_FORM);
  const [featureTogglingIds, setFeatureTogglingIds] = useState<Set<string>>(new Set());

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const {
    data: rawImages,
    isLoading,
    isError,
    error,
  } = api.portfolio.list.useQuery({});

  const images = (rawImages ?? []) as PortfolioImage[];

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const addMutation = api.portfolio.add.useMutation({
    onSuccess: () => {
      void utils.portfolio.list.invalidate();
      setUploadDialogOpen(false);
      setFormData(EMPTY_FORM);
      toast({
        title: "Image uploaded",
        description: "Your portfolio image has been added successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Upload failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.portfolio.update.useMutation({
    onSuccess: () => {
      void utils.portfolio.list.invalidate();
      setEditDialogOpen(false);
      setSelectedImage(null);
      setFormData(EMPTY_FORM);
      toast({
        title: "Image updated",
        description: "Portfolio image details have been saved.",
      });
    },
    onError: (err) => {
      toast({
        title: "Update failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeMutation = api.portfolio.remove.useMutation({
    onSuccess: () => {
      void utils.portfolio.list.invalidate();
      setDeleteDialogOpen(false);
      setSelectedImage(null);
      toast({
        title: "Image deleted",
        description: "The portfolio image has been removed.",
      });
    },
    onError: (err) => {
      toast({
        title: "Delete failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const featureToggleMutation = api.portfolio.update.useMutation({
    onSuccess: (_data, variables) => {
      void utils.portfolio.list.invalidate();
      setFeatureTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.imageId);
        return next;
      });
    },
    onError: (err, variables) => {
      setFeatureTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.imageId);
        return next;
      });
      toast({
        title: "Failed to update",
        description: err.message || "Could not toggle featured status.",
        variant: "destructive",
      });
    },
  });

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const img of images) {
      if (img.eventType) {
        counts[img.eventType] = (counts[img.eventType] || 0) + 1;
      }
    }
    return counts;
  }, [images]);

  const uniqueEventTypes = useMemo(() => getUniqueEventTypes(images), [images]);

  const featuredCount = useMemo(
    () => images.filter((img) => img.isFeatured).length,
    [images],
  );

  const filteredAndSorted = useMemo(() => {
    let result = [...images];

    // Filter by event type
    if (activeFilter !== "all") {
      result = result.filter((img) => img.eventType === activeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (img) =>
          (img.caption && img.caption.toLowerCase().includes(q)) ||
          (img.eventType && formatEventType(img.eventType).toLowerCase().includes(q)),
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => {
          const da = a.eventDate ? new Date(a.eventDate).getTime() : 0;
          const db = b.eventDate ? new Date(b.eventDate).getTime() : 0;
          return db - da;
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          const da = a.eventDate ? new Date(a.eventDate).getTime() : Infinity;
          const db = b.eventDate ? new Date(b.eventDate).getTime() : Infinity;
          return da - db;
        });
        break;
      case "featured":
        result.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return a.sortOrder - b.sortOrder;
        });
        break;
      case "event_type":
        result.sort((a, b) => {
          const ta = a.eventType || "zzz";
          const tb = b.eventType || "zzz";
          return ta.localeCompare(tb);
        });
        break;
    }

    return result;
  }, [images, activeFilter, searchQuery, sortBy]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleOpenUpload = useCallback(() => {
    setFormData(EMPTY_FORM);
    setUploadDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((image: PortfolioImage) => {
    setSelectedImage(image);
    setFormData({
      imageUrl: image.imageUrl,
      thumbnailUrl: image.thumbnailUrl ?? "",
      caption: image.caption ?? "",
      eventType: image.eventType ?? "",
      eventDate: image.eventDate
        ? new Date(image.eventDate).toISOString().split("T")[0] ?? ""
        : "",
      isFeatured: image.isFeatured,
    });
    setEditDialogOpen(true);
  }, []);

  const handleOpenDelete = useCallback((image: PortfolioImage) => {
    setSelectedImage(image);
    setDeleteDialogOpen(true);
  }, []);

  const handleToggleFeatured = useCallback(
    (image: PortfolioImage) => {
      setFeatureTogglingIds((prev) => new Set(prev).add(image.id));
      featureToggleMutation.mutate({
        imageId: image.id,
        isFeatured: !image.isFeatured,
      });
    },
    [featureToggleMutation],
  );

  const handleSubmitUpload = useCallback(() => {
    if (!formData.imageUrl.trim()) {
      toast({
        title: "Image URL required",
        description: "Please enter a valid image URL to upload.",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate({
      imageUrl: formData.imageUrl.trim(),
      thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
      caption: formData.caption.trim() || undefined,
      eventType: formData.eventType || undefined,
      eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
    });
  }, [formData, addMutation, toast]);

  const handleSubmitEdit = useCallback(() => {
    if (!selectedImage) return;

    updateMutation.mutate({
      imageId: selectedImage.id,
      caption: formData.caption.trim() || undefined,
      eventType: formData.eventType || undefined,
      eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
      isFeatured: formData.isFeatured,
    });
  }, [selectedImage, formData, updateMutation]);

  const handleConfirmDelete = useCallback(() => {
    if (!selectedImage) return;
    removeMutation.mutate({ imageId: selectedImage.id });
  }, [selectedImage, removeMutation]);

  const updateField = useCallback(
    <K extends keyof UploadFormData>(field: K, value: UploadFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Grid columns class
  // -------------------------------------------------------------------------

  const gridClassName = useMemo(() => {
    switch (gridCols) {
      case 2:
        return "grid grid-cols-1 sm:grid-cols-2 gap-4";
      case 3:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
      case 4:
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";
      default:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
    }
  }, [gridCols]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}
      <DashboardPageHeader
        title="Portfolio"
        description="Showcase your best catering work to attract new clients"
        icon={<Camera className="h-5 w-5" />}
        actions={
          <Button
            onClick={handleOpenUpload}
            className="gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Upload Image
          </Button>
        }
      />

      {/* ----------------------------------------------------------------- */}
      {/* Stats Row */}
      {/* ----------------------------------------------------------------- */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Images"
            value={images.length}
            icon={<ImageIcon className="h-5 w-5 text-primary" />}
            accent="bg-primary/10"
          />
          <StatCard
            label="Featured"
            value={featuredCount}
            icon={<Star className="h-5 w-5 text-gold fill-gold" />}
            accent="bg-gold/10"
          />
          <StatCard
            label="Event Types"
            value={uniqueEventTypes.length}
            icon={<Sparkles className="h-5 w-5 text-terracotta" />}
            accent="bg-terracotta/10"
          />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Filter & Search Bar */}
      {/* ----------------------------------------------------------------- */}
      {!isLoading && images.length > 0 && (
        <div className="space-y-4">
          {/* Search + Sort + Grid controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by caption or event type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Grid size toggle */}
              <div className="hidden sm:flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5">
                <button
                  onClick={() => setGridCols(2)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    gridCols === 2
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="2 columns"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    gridCols === 3
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="3 columns"
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    gridCols === 4
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="4 columns"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Event type filter pills */}
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="All"
              active={activeFilter === "all"}
              count={images.length}
              onClick={() => setActiveFilter("all")}
            />
            {EVENT_TYPES.map((type) => {
              const count = eventTypeCounts[type];
              if (!count) return null;
              return (
                <FilterPill
                  key={type}
                  label={formatEventType(type)}
                  active={activeFilter === type}
                  count={count}
                  onClick={() =>
                    setActiveFilter(activeFilter === type ? "all" : type)
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Gallery Grid */}
      {/* ----------------------------------------------------------------- */}
      {isLoading ? (
        <GallerySkeletons count={8} />
      ) : isError ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
              <X className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="font-semibold text-destructive">Failed to load portfolio</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {error?.message || "An unexpected error occurred while loading your portfolio images."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void utils.portfolio.list.invalidate()}
            >
              Try Again
            </Button>
          </div>
        </Card>
      ) : images.length === 0 ? (
        <EmptyState onUpload={handleOpenUpload} />
      ) : filteredAndSorted.length === 0 ? (
        /* No results for current filter/search */
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <Search className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-foreground">No images found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
            {searchQuery
              ? `No portfolio images match "${searchQuery}".`
              : `No images for "${formatEventType(activeFilter)}" events.`}
          </p>
          <div className="flex gap-2 mt-4">
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
            {activeFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter("all")}
              >
                Show All
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {filteredAndSorted.length} of {images.length} image
              {images.length !== 1 ? "s" : ""}
              {activeFilter !== "all" && (
                <> in <span className="font-medium text-foreground">{formatEventType(activeFilter)}</span></>
              )}
            </span>
            {searchQuery && (
              <span>
                Search: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          {/* Grid */}
          <div className={gridClassName}>
            {filteredAndSorted.map((image) => (
              <PortfolioCard
                key={image.id}
                image={image}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                onToggleFeatured={handleToggleFeatured}
                isTogglingFeatured={featureTogglingIds.has(image.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Upload Image Dialog */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Portfolio Image
            </DialogTitle>
            <DialogDescription>
              Add a new image to your portfolio. Enter the image URL and fill in the details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="upload-url" className="text-sm font-medium">
                Image URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="upload-url"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
              />
              {/* Preview */}
              {formData.imageUrl && (
                <ImagePreview
                  url={formData.imageUrl}
                  alt="Upload preview"
                />
              )}
            </div>

            {/* Thumbnail URL (optional) */}
            <div className="space-y-2">
              <Label htmlFor="upload-thumb" className="text-sm font-medium">
                Thumbnail URL
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              <Input
                id="upload-thumb"
                placeholder="https://example.com/thumb.jpg"
                value={formData.thumbnailUrl}
                onChange={(e) => updateField("thumbnailUrl", e.target.value)}
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="upload-caption" className="text-sm font-medium">
                Caption
              </Label>
              <Input
                id="upload-caption"
                placeholder="e.g. Elegant wedding reception at Palais Namaskar"
                value={formData.caption}
                onChange={(e) => updateField("caption", e.target.value)}
                maxLength={200}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {formData.caption.length}/200
              </p>
            </div>

            {/* Event Type + Date row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Event Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(v) => updateField("eventType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatEventType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="upload-date" className="text-sm font-medium">
                  Event Date
                </Label>
                <Input
                  id="upload-date"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => updateField("eventDate", e.target.value)}
                />
              </div>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-gold/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                  Featured Image
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Featured images appear first on your public profile
                </p>
              </div>
              <Switch
                checked={formData.isFeatured}
                onCheckedChange={(checked) => updateField("isFeatured", checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={addMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUpload}
              disabled={!formData.imageUrl.trim() || addMutation.isLoading}
              className="gap-2 bg-gradient-to-r from-primary to-terracotta hover:from-primary/90 hover:to-terracotta/90 text-white"
            >
              {addMutation.isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Edit Image Dialog */}
      {/* ----------------------------------------------------------------- */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedImage(null);
            setFormData(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Image Details
            </DialogTitle>
            <DialogDescription>
              Update the caption, event type, date, or featured status for this image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current image preview */}
            {selectedImage && (
              <ImagePreview
                url={selectedImage.thumbnailUrl ?? selectedImage.imageUrl}
                alt={selectedImage.caption || "Portfolio image"}
              />
            )}

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="edit-caption" className="text-sm font-medium">
                Caption
              </Label>
              <Input
                id="edit-caption"
                placeholder="e.g. Elegant wedding reception at Palais Namaskar"
                value={formData.caption}
                onChange={(e) => updateField("caption", e.target.value)}
                maxLength={200}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {formData.caption.length}/200
              </p>
            </div>

            {/* Event Type + Date row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Event Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(v) => updateField("eventType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatEventType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="edit-date" className="text-sm font-medium">
                  Event Date
                </Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => updateField("eventDate", e.target.value)}
                />
              </div>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-gold/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                  Featured Image
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Featured images appear first on your public profile
                </p>
              </div>
              <Switch
                checked={formData.isFeatured}
                onCheckedChange={(checked) => updateField("isFeatured", checked)}
              />
            </div>

            {/* Danger zone: Delete from edit dialog */}
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Image</p>
                  <p className="text-[11px] text-destructive/70">
                    Permanently remove this image from your portfolio
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setEditDialogOpen(false);
                    // Small delay so edit dialog closes before delete opens
                    setTimeout(() => {
                      setDeleteDialogOpen(true);
                    }, 150);
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isLoading}
              className="gap-2 bg-gradient-to-r from-primary to-terracotta hover:from-primary/90 hover:to-terracotta/90 text-white"
            >
              {updateMutation.isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Delete Confirmation Dialog */}
      {/* ----------------------------------------------------------------- */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedImage(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              Delete Portfolio Image
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Are you sure you want to delete this image? This action cannot be undone.
              </span>
              {selectedImage && (
                <span className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                  {(selectedImage.thumbnailUrl || selectedImage.imageUrl) && (
                    <img
                      src={selectedImage.thumbnailUrl ?? selectedImage.imageUrl}
                      alt={selectedImage.caption || "Image to delete"}
                      className="h-12 w-16 rounded-md object-cover"
                    />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {selectedImage.caption || "Untitled image"}
                    </span>
                    {selectedImage.eventType && (
                      <span className="block text-xs text-muted-foreground">
                        {formatEventType(selectedImage.eventType)}
                        {selectedImage.eventDate &&
                          ` - ${formatDate(selectedImage.eventDate)}`}
                      </span>
                    )}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={removeMutation.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
            >
              {removeMutation.isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Image
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
