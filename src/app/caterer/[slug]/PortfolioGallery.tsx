"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  Maximize2,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

interface PortfolioImage {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  eventType: string | null;
  isFeatured: boolean;
}

interface PortfolioGalleryProps {
  images: PortfolioImage[];
  orgName: string;
}

// ────────────────────────────────────────────────────────────────────
// Lightbox
// ────────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
  orgName,
}: {
  images: PortfolioImage[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  orgName: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const image = images[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrevious();
          break;
        case "ArrowRight":
          onNext();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrevious, onNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!image) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Portfolio image ${currentIndex + 1} of ${images.length}`}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={onPrevious}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Next */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Image */}
      <div className="relative mx-16 max-h-[85vh] max-w-[85vw]">
        <Image
          src={image.imageUrl}
          alt={image.caption ?? `${orgName} portfolio image ${currentIndex + 1}`}
          width={1200}
          height={800}
          className="max-h-[85vh] w-auto rounded-lg object-contain"
          sizes="85vw"
          priority
        />
      </div>

      {/* Caption bar */}
      {(image.caption || image.eventType) && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-2xl bg-white/10 px-5 py-2.5 text-center backdrop-blur-sm">
          {image.caption && (
            <p className="text-sm font-medium text-white">{image.caption}</p>
          )}
          {image.eventType && (
            <p className="mt-0.5 text-[11px] text-white/60">
              {image.eventType}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Gallery Grid
// ────────────────────────────────────────────────────────────────────

export function PortfolioGallery({ images, orgName }: PortfolioGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayImages = showAll ? images : images.slice(0, 9);
  const hasMore = images.length > 9 && !showAll;

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const goToPrevious = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null,
    );
  }, [images.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : null,
    );
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {displayImages.map((img, index) => (
          <button
            key={img.id}
            type="button"
            onClick={() => openLightbox(index)}
            className="group relative aspect-square overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:ring-offset-2"
            aria-label={
              img.caption ?? `View portfolio image ${index + 1}`
            }
          >
            <Image
              src={img.thumbnailUrl ?? img.imageUrl}
              alt={img.caption ?? `${orgName} portfolio`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex w-full items-end justify-between p-3">
                <div className="min-w-0 flex-1">
                  {img.caption && (
                    <p className="truncate text-xs font-medium text-white">
                      {img.caption}
                    </p>
                  )}
                  {img.eventType && (
                    <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                      {img.eventType}
                    </span>
                  )}
                </div>
                <Maximize2 className="h-4 w-4 flex-shrink-0 text-white/60" />
              </div>
            </div>
            {img.isFeatured && (
              <div className="absolute left-2 top-2">
                <Award className="h-4 w-4 text-gold drop-shadow-sm" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Show more button */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-ember/20 hover:text-foreground"
          >
            View all {images.length} photos
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
          orgName={orgName}
        />
      )}
    </>
  );
}
