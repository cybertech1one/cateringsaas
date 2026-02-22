"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { DashboardHeader } from "~/pageComponents/Dashboard/molecules/Header";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Heart,
  Pencil,
  Trash2,
  Stamp,
  Users,
  Gift,
} from "lucide-react";

const ProgramDialog = dynamic(
  () =>
    import("./molecules/ProgramDialog").then((mod) => ({
      default: mod.ProgramDialog,
    })),
  { ssr: false },
);

const StampDialog = dynamic(
  () =>
    import("./molecules/StampDialog").then((mod) => ({
      default: mod.StampDialog,
    })),
  { ssr: false },
);

const CardsPanel = dynamic(
  () =>
    import("./molecules/CardsPanel").then((mod) => ({
      default: mod.CardsPanel,
    })),
  { ssr: false },
);

type LoyaltyProgram = {
  id: string;
  menuId: string;
  name: string;
  description: string | null;
  stampsRequired: number;
  rewardDescription: string;
  rewardType: string;
  rewardValue: number | null;
  isActive: boolean | null;
  icon: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { cards: number };
};

export function LoyaltyPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [stampDialogOpen, setStampDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(
    null,
  );
  const [stampProgramId, setStampProgramId] = useState<string>("");
  const [viewingCardsProgram, setViewingCardsProgram] =
    useState<LoyaltyProgram | null>(null);

  const { data: menus, isLoading: menusLoading } =
    api.menus.getMenus.useQuery();

  const {
    data: programs,
    isLoading: programsLoading,
    refetch: refetchPrograms,
  } = api.loyalty.getPrograms.useQuery(
    { menuId: selectedMenuId },
    { enabled: !!selectedMenuId },
  );

  const deleteMutation = api.loyalty.deleteProgram.useMutation({
    onSuccess: () => {
      toast({
        title: t("loyalty.programDeleted"),
        description: t("loyalty.programDeletedDescription"),
      });
      void refetchPrograms();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = useCallback(() => {
    setEditingProgram(null);
    setProgramDialogOpen(true);
  }, []);

  const handleEdit = useCallback((program: LoyaltyProgram) => {
    setEditingProgram(program);
    setProgramDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    (programId: string) => {
      if (window.confirm(t("loyalty.deleteConfirm"))) {
        deleteMutation.mutate({ programId });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation.mutate, t],
  );

  const handleDialogClose = useCallback(() => {
    setProgramDialogOpen(false);
    setEditingProgram(null);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setProgramDialogOpen(false);
    setEditingProgram(null);
    void refetchPrograms();
  }, [refetchPrograms]);

  const handleOpenStampDialog = useCallback((programId: string) => {
    setStampProgramId(programId);
    setStampDialogOpen(true);
  }, []);

  const handleStampDialogClose = useCallback(() => {
    setStampDialogOpen(false);
    setStampProgramId("");
  }, []);

  const handleStampSuccess = useCallback(() => {
    setStampDialogOpen(false);
    setStampProgramId("");
    void refetchPrograms();
  }, [refetchPrograms]);

  const handleViewCards = useCallback((program: LoyaltyProgram) => {
    setViewingCardsProgram(program);
  }, []);

  const handleCloseCards = useCallback(() => {
    setViewingCardsProgram(null);
  }, []);

  const rewardTypeLabel = useCallback(
    (type: string) => {
      switch (type) {
        case "free_item":
          return t("loyalty.rewardTypeFreeItem");
        case "discount_percent":
          return t("loyalty.rewardTypeDiscountPercent");
        case "discount_amount":
          return t("loyalty.rewardTypeDiscountAmount");
        default:
          return type;
      }
    },
    [t],
  );

  if (menusLoading) {
    return (
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <DashboardShell>
          <DashboardHeader
            heading={t("loyalty.title")}
            text={t("loyalty.description")}
          >
            <Button className="rounded-full px-6 shadow-sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              {t("loyalty.createProgram")}
            </Button>
          </DashboardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/50 bg-card p-6"
              >
                <div className="space-y-3">
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </DashboardShell>
      </main>
    );
  }

  if (viewingCardsProgram) {
    return (
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <CardsPanel
          program={viewingCardsProgram}
          onBack={handleCloseCards}
          onRefetchPrograms={refetchPrograms}
        />
      </main>
    );
  }

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Page Header */}
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-sm">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {t("loyalty.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("loyalty.description")}
              </p>
            </div>
          </div>
          {selectedMenuId && (
            <Button
              className="gap-2 rounded-full px-6 shadow-sm"
              variant="default"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4" />
              {t("loyalty.createProgram")}
            </Button>
          )}
        </div>

        {/* Menu selector */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            {t("loyalty.selectMenu")}
          </label>
          <div className="max-w-sm">
            <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
              <SelectTrigger className="rounded-lg">
                <SelectValue
                  placeholder={t("loyalty.selectMenuPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {menus?.map(
                  (menu: { id: string; name: string; slug: string }) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedMenuId && programsLoading && <LoadingScreen />}

        {selectedMenuId && !programsLoading && (
          <div>
            {!programs?.length ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Heart className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="mt-6 text-xl font-semibold">
                  {t("loyalty.noPrograms")}
                </h2>
                <p className="mb-8 mt-2 max-w-md text-center text-sm font-normal leading-6 text-muted-foreground">
                  {t("loyalty.noProgramsDescription")}
                </p>
                <Button
                  className="rounded-full"
                  variant="default"
                  onClick={handleCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("loyalty.createProgram")}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {programs.map((program: LoyaltyProgram) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    rewardTypeLabel={rewardTypeLabel}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddStamp={handleOpenStampDialog}
                    onViewCards={handleViewCards}
                    t={t as (key: string, opts?: Record<string, unknown>) => string}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </DashboardShell>

      <ProgramDialog
        open={programDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
        }}
        menuId={selectedMenuId}
        program={editingProgram}
        onSuccess={handleDialogSuccess}
      />

      <StampDialog
        open={stampDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleStampDialogClose();
        }}
        programId={stampProgramId}
        onSuccess={handleStampSuccess}
      />
    </main>
  );
}

function ProgramCard({
  program,
  rewardTypeLabel,
  onEdit,
  onDelete,
  onAddStamp,
  onViewCards,
  t,
}: {
  program: LoyaltyProgram;
  rewardTypeLabel: (type: string) => string;
  onEdit: (program: LoyaltyProgram) => void;
  onDelete: (id: string) => void;
  onAddStamp: (programId: string) => void;
  onViewCards: (program: LoyaltyProgram) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{ backgroundColor: program.color + "20" }}
          >
            {program.icon}
          </span>
          <div>
            <h3 className="font-semibold">{program.name}</h3>
            <p className="text-sm text-muted-foreground">
              {program.stampsRequired} {t("loyalty.stamps")}
            </p>
          </div>
        </div>
        <Badge variant={program.isActive ? "default" : "secondary"}>
          {program.isActive ? t("loyalty.active") : t("loyalty.inactive")}
        </Badge>
      </div>

      {program.description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {program.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Gift className="h-3.5 w-3.5" />
          {rewardTypeLabel(program.rewardType)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {program._count.cards} {t("loyalty.cards")}
        </span>
      </div>

      <p className="mt-2 text-sm">
        <span className="font-medium">{t("loyalty.rewardDescription")}:</span>{" "}
        {program.rewardDescription}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddStamp(program.id)}
          disabled={!program.isActive}
        >
          <Stamp className="mr-1.5 h-3.5 w-3.5" />
          {t("loyalty.addStamp")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewCards(program)}
        >
          <Users className="mr-1.5 h-3.5 w-3.5" />
          {t("loyalty.viewCards")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(program)}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          {t("loyalty.editProgram")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(program.id)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {t("loyalty.deleteProgram")}
        </Button>
      </div>
    </div>
  );
}
