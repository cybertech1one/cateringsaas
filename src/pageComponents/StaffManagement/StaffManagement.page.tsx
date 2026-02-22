"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { UserPlus, Trash2, Shield, Users } from "lucide-react";

export function StaffManagementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: menus, isLoading: menusLoading } =
    api.menus.getMenus.useQuery();

  const {
    data: staffMembers,
    isLoading: staffLoading,
    refetch: refetchStaff,
  } = api.staff.getStaffByMenu.useQuery(
    { menuId: selectedMenuId },
    { enabled: !!selectedMenuId },
  );

  const inviteMutation = api.staff.inviteStaff.useMutation({
    onSuccess: () => {
      toast({
        title: t("staffManagement.inviteSent"),
        description: t("staffManagement.inviteSentDescription", {
          email: inviteEmail,
        }),
      });
      setInviteEmail("");
      setDialogOpen(false);
      void refetchStaff();
    },
    onError: (err) => {
      toast({
        title: t("staffManagement.inviteFailed"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const removeMutation = api.staff.removeStaff.useMutation({
    onSuccess: () => {
      toast({ title: t("staffManagement.staffRemoved") });
      void refetchStaff();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = api.staff.toggleStaffActive.useMutation({
    onSuccess: () => {
      toast({ title: t("staffManagement.staffUpdated") });
      void refetchStaff();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (menusLoading) return <LoadingScreen />;

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Page Header */}
        <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {t("staffManagement.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("staffManagement.description")}
              </p>
            </div>
          </div>
          {selectedMenuId && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-full px-6 shadow-sm">
                  <UserPlus className="h-4 w-4" />
                  {t("staffManagement.inviteStaff")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("staffManagement.inviteStaff")}</DialogTitle>
                  <DialogDescription>
                    {t("staffManagement.inviteDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      {t("staffManagement.emailLabel")}
                    </label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={t("staffManagement.emailPlaceholder")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      {t("staffManagement.roleLabel")}
                    </label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) =>
                        setInviteRole(v as "manager" | "staff")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">
                          {t("staffManagement.roleManager")}
                        </SelectItem>
                        <SelectItem value="staff">
                          {t("staffManagement.roleStaff")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() =>
                      inviteMutation.mutate({
                        menuId: selectedMenuId,
                        email: inviteEmail,
                        role: inviteRole,
                      })
                    }
                    loading={inviteMutation.isLoading}
                    disabled={!inviteEmail}
                  >
                    {t("staffManagement.invite")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Menu selector */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            {t("staffManagement.selectMenu")}
          </label>
          <div className="max-w-sm">
            <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
              <SelectTrigger className="rounded-lg">
                <SelectValue
                  placeholder={t("staffManagement.selectMenuDescription")}
                />
              </SelectTrigger>
              <SelectContent>
                {menus?.map((menu) => (
                  <SelectItem key={menu.id} value={menu.id}>
                    {menu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Staff list */}
        {selectedMenuId && staffLoading && <LoadingScreen />}
        {selectedMenuId && !staffLoading && (
          <div>
            {!staffMembers?.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 py-16">
                <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">
                  {t("staffManagement.noStaff")}
                </h3>
                <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
                  {t("staffManagement.noStaffDescription")}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/50">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("staffManagement.name")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("staffManagement.email")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("staffManagement.role")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("staffManagement.status")}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("staffManagement.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {staffMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {member.user.fullName || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {member.user.email}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            <Shield className="h-3 w-3" />
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                staffMemberId: member.id,
                              })
                            }
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              member.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {member.isActive
                              ? t("staffManagement.active")
                              : t("staffManagement.inactive")}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeMutation.mutate({
                                staffMemberId: member.id,
                              })
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DashboardShell>
    </main>
  );
}
