"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

// ── Types ────────────────────────────────────────────────────

interface Menu {
  id: string;
  name: string;
}

interface MenuSelectorProps {
  menus: Menu[];
  selectedMenuId: string;
  onMenuChange: (menuId: string) => void;
}

interface StatusFilterProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

// ── MenuSelector ─────────────────────────────────────────────

export function MenuSelector({
  menus,
  selectedMenuId,
  onMenuChange,
}: MenuSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="min-w-[220px]">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("reviews.selectMenu")}
        </label>
        <Select value={selectedMenuId} onValueChange={onMenuChange}>
          <SelectTrigger className="rounded-lg border-border/60 bg-background shadow-sm">
            <SelectValue placeholder={t("reviews.selectMenuPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {menus.map((menu) => (
              <SelectItem key={menu.id} value={menu.id}>
                {menu.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ── StatusFilter ─────────────────────────────────────────────

export function StatusFilter({
  statusFilter,
  onStatusFilterChange,
}: StatusFilterProps) {
  const { t } = useTranslation();

  return (
    <Tabs value={statusFilter} onValueChange={onStatusFilterChange}>
      <TabsList>
        <TabsTrigger value="all">{t("reviews.all")}</TabsTrigger>
        <TabsTrigger value="pending">{t("reviews.pending")}</TabsTrigger>
        <TabsTrigger value="approved">{t("reviews.approved")}</TabsTrigger>
        <TabsTrigger value="rejected">{t("reviews.rejected")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
