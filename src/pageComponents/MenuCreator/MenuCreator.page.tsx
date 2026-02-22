"use client";

import { LoadingScreen } from "~/components/Loading";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";
import {
  AddDishButton,
} from "./molecules/AddDishButton/AddDishButton";
import {
  AddCategoryButton,
} from "./molecules/AddCategoryButton/AddCategoryButton";
import { parseDishes } from "~/utils/parseDishes";

import { useRef, useState } from "react";
import { getDefaultLanguage } from "~/utils/getDefaultLanguage";
import { useTranslation } from "react-i18next";
import { useHandleFetchError } from "~/shared/hooks/useHandleFetchError";
import { redirect } from "next/navigation";
import { MenuCreatorHeader } from "./molecules/MenuCreatorHeader/MenuCreatorHeader";
import { CategorySection } from "./molecules/CategorySection/CategorySection";
import { FolderPlus, Package, Utensils } from "lucide-react";
import dynamic from "next/dynamic";

const InventoryPanel = dynamic(
  () =>
    import("./molecules/InventoryPanel/InventoryPanel").then(
      (mod) => mod.InventoryPanel,
    ),
  { ssr: false },
);


export const MenuCreatorPage = ({
  params: { slug },
}: {
  params: { slug: string };
}) => {
  const { data, error, isLoading } = api.menus.getMenuBySlug.useQuery({ slug });
  const { toast } = useToast();
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(
    null,
  );
  const [showInventory, setShowInventory] = useState(false);
  const defaultLanguageSet = useRef(false);
  const { t } = useTranslation();

  useHandleFetchError({
    error,
    onError: () => {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("notifications.menuNotFound"),
        variant: "destructive",
      });
    },
  });
  if (error) return redirect("/");
  if (isLoading) return <LoadingScreen />;

  const defaultLanguage = getDefaultLanguage(data.menuLanguages);

  if (!defaultLanguageSet.current) {
    setSelectedLanguageId(defaultLanguage.languageId);
    defaultLanguageSet.current = true;
  }

  const parsedDishes = parseDishes(
    data,
    selectedLanguageId || defaultLanguage.languageId,
  );

  const totalDishes = parsedDishes.reduce((acc, c) => acc + c.dishes.length, 0);
  const totalCategories = parsedDishes.filter((c) => c.category).length;

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6 py-6">
      <MenuCreatorHeader
        name={data.name}
        city={data.city}
        address={data.address}
        logoImageUrl={data.logoImageUrl}
        menuLanguages={data.menuLanguages}
        selectedLanguageId={selectedLanguageId || defaultLanguage.languageId}
        onSelectedLanguageChange={setSelectedLanguageId}
      />

      {/* Stats + Actions Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Utensils className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{totalDishes}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("menuCreator.dishesList")}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <FolderPlus className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{totalCategories}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("menuCreator.categories")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInventory((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showInventory
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-background text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Package className="h-4 w-4" />
            {t("inventory.title")}
          </button>
          <AddDishButton />
          <AddCategoryButton />
        </div>
      </div>

      {/* Inventory Panel */}
      {showInventory && (
        <InventoryPanel
          menuId={data.id}
          defaultLanguageId={selectedLanguageId || defaultLanguage.languageId}
        />
      )}

      {/* Categories + Dishes */}
      <div className="flex flex-col gap-8">
        {parsedDishes.map(({ category, dishes }) => (
          <CategorySection
            key={category?.id ?? "no-category"}
            category={category}
            dishes={dishes}
            menuLanguages={data.menuLanguages}
          />
        ))}
      </div>
    </div>
  );
};
