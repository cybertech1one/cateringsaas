"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { LoadingScreen } from "~/components/Loading";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DriverStatus = "pending" | "active" | "suspended" | "rejected";

type TabKey = "pending" | "active" | "rejected";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminDriverPanel() {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const { toast } = useToast();
  const apiContext = api.useContext();

  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    driverId: string;
  } | null>(null);

  // Fetch applications
  const applicationsQuery = api.drivers.getDriverApplications.useQuery({
    status: activeTab === "active" ? "active" : activeTab,
    limit: 50,
  });

  // Mutations
  const updateStatusMutation = api.drivers.updateDriverStatus.useMutation({
    onSuccess: (result) => {
      setConfirmAction(null);
      setRejectReason("");
      void apiContext.drivers.getDriverApplications.invalidate();

      if (result.status === "active") {
        toast({
          title: t("driverRegistration.adminDriverApproved"),
        });
      } else if (result.status === "rejected") {
        toast({
          title: t("driverRegistration.adminDriverRejected"),
        });
      }
    },
    onError: () => {
      toast({
        title: t("driverRegistration.errorGeneric"),
        variant: "destructive",
      });
    },
  });

  const handleApprove = (driverId: string) => {
    updateStatusMutation.mutate({
      driverId,
      status: "active",
    });
  };

  const handleReject = (driverId: string) => {
    updateStatusMutation.mutate({
      driverId,
      status: "rejected",
      reason: rejectReason.trim() || undefined,
    });
  };

  const toggleExpand = (driverId: string) => {
    setExpandedDriverId((prev) => (prev === driverId ? null : driverId));
  };

  const tabs: { key: TabKey; labelKey: string; icon: typeof Clock }[] = [
    { key: "pending", labelKey: "driverRegistration.adminTabPending", icon: Clock },
    { key: "active", labelKey: "driverRegistration.adminTabApproved", icon: CheckCircle2 },
    { key: "rejected", labelKey: "driverRegistration.adminTabRejected", icon: XCircle },
  ];

  const counts = applicationsQuery.data?.counts;
  const drivers = applicationsQuery.data?.drivers ?? [];

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "pending":
        return t("driverRegistration.adminNoPending");
      case "active":
        return t("driverRegistration.adminNoApproved");
      case "rejected":
        return t("driverRegistration.adminNoRejected");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t("driverRegistration.adminTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("driverRegistration.adminDesc")}
        </p>
      </div>

      {/* Stats */}
      {counts && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label={t("driverRegistration.adminTotalApplications")}
            value={counts.total}
            icon={Users}
          />
          <StatCard
            label={t("driverRegistration.adminPendingCount")}
            value={counts.pending}
            icon={Clock}
            color="text-amber-500"
          />
          <StatCard
            label={t("driverRegistration.adminApprovedCount")}
            value={counts.active}
            icon={CheckCircle2}
            color="text-emerald-500"
          />
          <StatCard
            label={t("driverRegistration.adminRejectedCount")}
            value={counts.rejected}
            icon={XCircle}
            color="text-red-500"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {tabs.map(({ key, labelKey, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
            {counts && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {key === "pending"
                  ? counts.pending
                  : key === "active"
                    ? counts.active
                    : counts.rejected}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {applicationsQuery.isLoading ? (
        <LoadingScreen />
      ) : drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{getEmptyMessage()}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drivers.map((driver) => {
            const isExpanded = expandedDriverId === driver.id;
            const isConfirming = confirmAction?.driverId === driver.id;

            return (
              <div
                key={driver.id}
                className="overflow-hidden rounded-xl border border-border"
              >
                {/* Collapsed row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(driver.id)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {driver.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{driver.fullName}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {driver.city}
                        </span>
                        <span>{driver.vehicleType}</span>
                        <span>
                          {new Date(driver.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={driver.status as DriverStatus} t={t} />
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Contact info */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("driverRegistration.sectionPersonal")}
                        </h5>
                        <DetailRow
                          icon={Phone}
                          label={t("driverRegistration.adminPhone")}
                          value={driver.phone}
                        />
                        <DetailRow
                          icon={Mail}
                          label={t("driverRegistration.adminEmail")}
                          value={driver.email ?? "--"}
                        />
                        <DetailRow
                          icon={MapPin}
                          label={t("driverRegistration.adminCity")}
                          value={driver.city}
                        />
                        {driver.emergencyContactName && (
                          <DetailRow
                            icon={AlertTriangle}
                            label={t("driverRegistration.adminEmergencyContact")}
                            value={`${driver.emergencyContactName} (${driver.emergencyContactPhone ?? "--"})`}
                          />
                        )}
                        {driver.dateOfBirth && (
                          <DetailRow
                            icon={FileText}
                            label={t("driverRegistration.dateOfBirth")}
                            value={new Date(
                              driver.dateOfBirth,
                            ).toLocaleDateString()}
                          />
                        )}
                      </div>

                      {/* Vehicle & Documents */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("driverRegistration.sectionVehicle")}
                        </h5>
                        <DetailRow
                          icon={FileText}
                          label={t("driverRegistration.adminVehicle")}
                          value={driver.vehicleType}
                        />
                        {driver.vehiclePlate && (
                          <DetailRow
                            icon={FileText}
                            label={t("driverRegistration.plateNumber")}
                            value={driver.vehiclePlate}
                          />
                        )}
                        {driver.vehicleMake && (
                          <DetailRow
                            icon={FileText}
                            label={t("driverRegistration.vehicleMake")}
                            value={driver.vehicleMake}
                          />
                        )}
                        {driver.idNumber && (
                          <DetailRow
                            icon={FileText}
                            label={t("driverRegistration.idNumber")}
                            value={driver.idNumber}
                          />
                        )}

                        {/* Documents */}
                        {driver.documents.length > 0 && (
                          <div className="mt-3">
                            <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("driverRegistration.adminDocuments")}
                            </h5>
                            <div className="space-y-1">
                              {driver.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-xs"
                                >
                                  <span>{doc.documentType}</span>
                                  <StatusBadge
                                    status={doc.status as DriverStatus}
                                    t={t}
                                    small
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {activeTab === "pending" && (
                      <div className="mt-4 border-t border-border pt-4">
                        {isConfirming ? (
                          <div className="space-y-3">
                            {confirmAction?.type === "reject" && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  {t("driverRegistration.adminRejectReason")}
                                </label>
                                <Input
                                  value={rejectReason}
                                  onChange={(e) =>
                                    setRejectReason(e.target.value)
                                  }
                                  placeholder={t(
                                    "driverRegistration.adminRejectReasonPlaceholder",
                                  )}
                                  className="h-10"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-sm text-muted-foreground">
                                {confirmAction?.type === "approve"
                                  ? t("driverRegistration.adminConfirmApprove")
                                  : t("driverRegistration.adminConfirmReject")}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmAction(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                disabled={updateStatusMutation.isLoading}
                                onClick={() => {
                                  if (confirmAction?.type === "approve") {
                                    handleApprove(driver.id);
                                  } else {
                                    handleReject(driver.id);
                                  }
                                }}
                                className={
                                  confirmAction?.type === "approve"
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-destructive text-white hover:bg-destructive/90"
                                }
                              >
                                {updateStatusMutation.isLoading && (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                )}
                                {confirmAction?.type === "approve"
                                  ? t("driverRegistration.adminApprove")
                                  : t("driverRegistration.adminReject")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                setConfirmAction({
                                  type: "approve",
                                  driverId: driver.id,
                                })
                              }
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              {t("driverRegistration.adminApprove")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setConfirmAction({
                                  type: "reject",
                                  driverId: driver.id,
                                })
                              }
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              {t("driverRegistration.adminReject")}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color ?? "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({
  status,
  t,
  small,
}: {
  status: DriverStatus;
  t: (key: string) => string;
  small?: boolean;
}) {
  const styles: Record<DriverStatus, string> = {
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    active:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    suspended:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const labels: Record<DriverStatus, string> = {
    pending: t("driverRegistration.statusPending"),
    active: t("driverRegistration.statusApproved"),
    suspended: t("driverRegistration.statusSuspended"),
    rejected: t("driverRegistration.statusRejected"),
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${styles[status] ?? styles.pending}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
