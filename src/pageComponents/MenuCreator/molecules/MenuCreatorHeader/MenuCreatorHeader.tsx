"use client";

import Image from "next/image";
import { Icons } from "~/components/Icons";
import { shimmerToBase64 } from "~/utils/shimmer";
import { MenuLanguagesSelector } from "~/components/LanguagesSelector/LanguagesSelector";
import { type FullMenuOutput } from "~/utils/parseDishes";

export interface MenuCreatorHeaderProps {
  name: string;
  city: string;
  address: string;
  logoImageUrl: string | null;
  menuLanguages: FullMenuOutput["menuLanguages"];
  selectedLanguageId: string;
  onSelectedLanguageChange: (languageId: string) => void;
}

export const MenuCreatorHeader = ({
  name,
  city,
  address,
  logoImageUrl,
  menuLanguages,
  selectedLanguageId,
  onSelectedLanguageChange,
}: MenuCreatorHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {logoImageUrl ? (
            <Image
              src={logoImageUrl}
              fill
              alt={`${name} restaurant logo`}
              className="object-cover"
              sizes="48px"
              placeholder="blur"
              blurDataURL={shimmerToBase64(48, 48)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Icons.utensils className="h-5 w-5 text-primary/60" />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">
            {name}
          </h1>
          {(city || address) && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icons.map className="h-3 w-3" />
              {[city, address].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>
      <MenuLanguagesSelector
        menuLanguages={menuLanguages}
        selectedLanguageId={selectedLanguageId}
        onSelectedLanguageChange={onSelectedLanguageChange}
      />
    </div>
  );
};
