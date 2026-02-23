"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Phone,
  Clock,
  CheckCircle2,
  UserCheck,
  UserX,
  CalendarDays,
  DollarSign,
  ChefHat,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  LogIn,
  LogOut,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";
import { Skeleton } from "~/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAFF_ROLES = [
  "head_chef",
  "sous_chef",
  "cook",
  "server",
  "bartender",
  "setup_crew",
  "coordinator",
  "driver",
  "cleanup",
  "photographer",
  "dj",
  "other",
] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

const ROLE_CONFIG: Record<StaffRole, { label: string; color: string; bg: string }> = {
  head_chef: { label: "Chef Principal", color: "text-[hsl(var(--saffron))]", bg: "bg-[hsl(var(--saffron))]/10" },
  sous_chef: { label: "Sous Chef", color: "text-terracotta", bg: "bg-terracotta/10" },
  cook: { label: "Cuisinier", color: "text-[hsl(var(--mint-tea))]", bg: "bg-[hsl(var(--mint-tea))]/10" },
  server: { label: "Serveur", color: "text-[hsl(var(--majorelle-blue))]", bg: "bg-[hsl(var(--majorelle-blue))]/10" },
  bartender: { label: "Barman", color: "text-[hsl(var(--zellige-teal))]", bg: "bg-[hsl(var(--zellige-teal))]/10" },
  setup_crew: { label: "Equipe Setup", color: "text-sage", bg: "bg-sage/10" },
  coordinator: { label: "Coordinateur", color: "text-gold", bg: "bg-gold/10" },
  driver: { label: "Chauffeur", color: "text-muted-foreground", bg: "bg-muted" },
  cleanup: { label: "Nettoyage", color: "text-muted-foreground", bg: "bg-muted" },
  photographer: { label: "Photographe", color: "text-[hsl(var(--rose-petal))]", bg: "bg-[hsl(var(--rose-petal))]/10" },
  dj: { label: "DJ", color: "text-primary", bg: "bg-primary/10" },
  other: { label: "Autre", color: "text-muted-foreground", bg: "bg-muted" },
};

const ASSIGNMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  assigned: { label: "Assign\u00e9", color: "text-[hsl(var(--majorelle-blue))]", bg: "bg-[hsl(var(--majorelle-blue))]/10" },
  confirmed: { label: "Confirm\u00e9", color: "text-sage", bg: "bg-sage/10" },
  checked_in: { label: "Arriv\u00e9", color: "text-[hsl(var(--mint-tea))]", bg: "bg-[hsl(var(--mint-tea))]/10" },
  checked_out: { label: "Parti", color: "text-muted-foreground", bg: "bg-muted" },
  no_show: { label: "Absent", color: "text-destructive", bg: "bg-destructive/10" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(centimes: number | null | undefined): string {
  if (centimes == null || centimes === 0) return "-";
  return `${(centimes / 100).toLocaleString("fr-MA")} MAD`;
}

function formatTime(time: Date | string | null): string {
  if (!time) return "";
  const d = new Date(time);
  return d.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Role badge with Moroccan color scheme */
function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role as StaffRole] ?? ROLE_CONFIG.other;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium border", config.bg, config.color)}>
      {config.label}
    </Badge>
  );
}

/** Assignment status badge */
function AssignmentStatusBadge({ status }: { status: string }) {
  const config = ASSIGNMENT_STATUS_CONFIG[status] ?? ASSIGNMENT_STATUS_CONFIG.assigned;
  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium border", config?.bg, config?.color)}>
      {config?.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Stats Bar
// ---------------------------------------------------------------------------

function StatsBar({
  totalStaff,
  upcomingShifts,
  checkedInToday,
  noShowRate,
}: {
  totalStaff: number;
  upcomingShifts: number;
  checkedInToday: number;
  noShowRate: number;
}) {
  const items = [
    {
      label: "Total Staff",
      value: totalStaff,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Upcoming Shifts",
      value: upcomingShifts,
      icon: CalendarDays,
      color: "text-gold",
      bg: "bg-gold/10",
    },
    {
      label: "Checked In Today",
      value: checkedInToday,
      icon: UserCheck,
      color: "text-sage",
      bg: "bg-sage/10",
    },
    {
      label: "No-Show Rate",
      value: `${noShowRate}%`,
      icon: noShowRate > 10 ? AlertTriangle : TrendingUp,
      color: noShowRate > 10 ? "text-destructive" : "text-[hsl(var(--mint-tea))]",
      bg: noShowRate > 10 ? "bg-destructive/10" : "bg-[hsl(var(--mint-tea))]/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", item.bg)}>
              <item.icon className={cn("h-5 w-5", item.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff Card
// ---------------------------------------------------------------------------

type StaffMember = {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  isFullTime: boolean;
  hourlyRate: number | null;
  dailyRate: number | null;
  skills: string[];
  isActive: boolean;
  rating: unknown;
};

function StaffCard({
  staff,
  onAssign,
}: {
  staff: StaffMember;
  onAssign: (staffId: string) => void;
}) {
  const roleConfig = ROLE_CONFIG[staff.role as StaffRole] ?? ROLE_CONFIG.other;

  return (
    <Card className={cn("border shadow-sm transition-all hover:shadow-md", !staff.isActive && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm leading-tight line-clamp-1">
              {staff.name}
            </h4>
            {staff.phone && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {staff.phone}
              </p>
            )}
          </div>
          <RoleBadge role={staff.role} />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Badge variant="secondary" className="text-[10px]">
            {staff.isFullTime ? "Temps plein" : "Freelance"}
          </Badge>
          {staff.hourlyRate && (
            <span className="flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(staff.hourlyRate)}/h
            </span>
          )}
          {staff.dailyRate && (
            <span className="flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(staff.dailyRate)}/j
            </span>
          )}
        </div>

        {staff.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {staff.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-[9px] font-normal">
                {skill}
              </Badge>
            ))}
            {staff.skills.length > 3 && (
              <Badge variant="outline" className="text-[9px] font-normal">
                +{staff.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => onAssign(staff.id)}
          disabled={!staff.isActive}
        >
          <CalendarDays className="h-3.5 w-3.5 mr-1" />
          Assign to Event
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Event Assignment Row
// ---------------------------------------------------------------------------

type AssignmentRow = {
  id: string;
  roleAtEvent: string;
  status: string;
  shiftStart: Date | string | null;
  shiftEnd: Date | string | null;
  payRate: number | null;
  notes: string | null;
  event?: {
    id: string;
    title: string | null;
    eventType: string;
    eventDate: Date | string;
    startTime: Date | string | null;
    endTime: Date | string | null;
    venueName: string | null;
    guestCount: number;
    status: string;
  } | null;
  staff?: {
    id: string;
    role: string;
  } | null;
};

function AssignmentCard({
  assignment,
  onCheckIn,
  onCheckOut,
  onRemove,
}: {
  assignment: AssignmentRow;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const canCheckIn = assignment.status === "assigned" || assignment.status === "confirmed";
  const canCheckOut = assignment.status === "checked_in";

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            {assignment.event && (
              <h4 className="font-semibold text-sm leading-tight line-clamp-1">
                {assignment.event.title || "Untitled Event"}
              </h4>
            )}
            <div className="flex items-center gap-2 mt-1">
              <RoleBadge role={assignment.roleAtEvent} />
              <AssignmentStatusBadge status={assignment.status} />
            </div>
          </div>
          {assignment.payRate && (
            <span className="text-xs font-medium text-gold">
              {formatCurrency(assignment.payRate)}
            </span>
          )}
        </div>

        {assignment.event && (
          <div className="text-xs text-muted-foreground space-y-0.5 mb-2">
            <p className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(assignment.event.eventDate)}
            </p>
            {(assignment.shiftStart || assignment.shiftEnd) && (
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(assignment.shiftStart)} - {formatTime(assignment.shiftEnd)}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-1.5">
          {canCheckIn && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs text-sage border-sage/30 hover:bg-sage/10"
              onClick={() => onCheckIn(assignment.id)}
            >
              <LogIn className="h-3.5 w-3.5 mr-1" />
              Check In
            </Button>
          )}
          {canCheckOut && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs text-[hsl(var(--saffron))] border-[hsl(var(--saffron))]/30 hover:bg-[hsl(var(--saffron))]/10"
              onClick={() => onCheckOut(assignment.id)}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Check Out
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(assignment.id)}
          >
            <UserX className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Availability Calendar (simplified weekly view)
// ---------------------------------------------------------------------------

function AvailabilityView({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const { data: availability, isLoading } = api.staffScheduling.checkAvailability.useQuery({
    date: selectedDate,
  });

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [selectedDate]);

  const totalAvailable = availability?.filter((s) => s.isAvailable).length ?? 0;
  const totalStaff = availability?.length ?? 0;

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Availability Calendar</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 7);
                onDateChange(prev);
              }}
            >
              &#8592;
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              {selectedDate.toLocaleDateString("fr-MA", { month: "short", year: "numeric" })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 7);
                onDateChange(next);
              }}
            >
              &#8594;
            </Button>
          </div>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                className={cn(
                  "h-10 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "hover:bg-muted"
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {/* Availability summary */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">
                {formatDate(selectedDate)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-sage font-medium">{totalAvailable}</span> available
                {" / "}
                <span className="font-medium">{totalStaff}</span> total staff
              </p>
              {availability && availability.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {availability.map((member) => (
                    <Badge
                      key={member.id}
                      variant="outline"
                      className={cn(
                        "text-[9px]",
                        member.isAvailable
                          ? "border-sage/30 text-sage bg-sage/5"
                          : "border-destructive/30 text-destructive bg-destructive/5"
                      )}
                    >
                      {member.isAvailable ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <UserX className="h-2.5 w-2.5 mr-0.5" />}
                      {ROLE_CONFIG[member.role as StaffRole]?.label ?? member.role}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Assign Staff Dialog
// ---------------------------------------------------------------------------

function AssignStaffDialog({
  open,
  onOpenChange,
  events,
  staffId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Array<{ id: string; title: string | null; eventDate: Date | string }>;
  staffId: string | null;
}) {
  const { toast } = useToast();
  const utils = api.useContext();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [payRate, setPayRate] = useState("");

  const assignMutation = api.staffScheduling.assignToEvent.useMutation({
    onSuccess: () => {
      toast({ title: "Staff assign\u00e9 avec succ\u00e8s" });
      void utils.staffScheduling.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = useCallback(() => {
    setSelectedEventId("");
    setSelectedRole("");
    setStartTime("");
    setEndTime("");
    setPayRate("");
  }, []);

  const handleSubmit = () => {
    if (!staffId || !selectedEventId || !selectedRole) return;

    assignMutation.mutate({
      eventId: selectedEventId,
      staffMemberId: staffId,
      roleAtEvent: selectedRole as StaffRole,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      payRate: payRate ? Math.round(parseFloat(payRate) * 100) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Assigner au Staff
          </DialogTitle>
          <DialogDescription>
            Choisissez un \u00e9v\u00e9nement et un r\u00f4le pour cette affectation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Event selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Ev\u00e9nement</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un \u00e9v\u00e9nement..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title || "Sans titre"} - {formatDate(event.eventDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">R\u00f4le</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un r\u00f4le..." />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_CONFIG[role].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">D\u00e9but</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fin</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Pay rate */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Taux (MAD)</Label>
            <Input
              type="number"
              placeholder="Ex: 150.00"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedEventId || !selectedRole || assignMutation.isLoading}
          >
            {assignMutation.isLoading ? "En cours..." : "Assigner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function StaffSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function StaffManagement() {
  const { toast } = useToast();
  const utils = api.useContext();
  const [activeTab, setActiveTab] = useState("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────
  const { data: members, isLoading: loadingMembers } = api.organizations.getMembers.useQuery({});
  const { data: events, isLoading: loadingEvents } = api.events.list.useQuery({});
  const { data: availability } = api.staffScheduling.checkAvailability.useQuery({
    date: new Date(),
  });

  // ── Mutations ────────────────────────────────────────────────────────
  const checkInMutation = api.staffScheduling.checkIn.useMutation({
    onSuccess: () => {
      toast({ title: "Check-in enregistr\u00e9" });
      void utils.staffScheduling.invalidate();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const checkOutMutation = api.staffScheduling.checkOut.useMutation({
    onSuccess: () => {
      toast({ title: "Check-out enregistr\u00e9" });
      void utils.staffScheduling.invalidate();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const removeMutation = api.staffScheduling.removeFromEvent.useMutation({
    onSuccess: () => {
      toast({ title: "Affectation supprim\u00e9e" });
      void utils.staffScheduling.invalidate();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  // ── Derived data ─────────────────────────────────────────────────────
  const staffList = useMemo(() => {
    if (!members) return [];
    return members.map((m) => ({
      id: m.id,
      name: m.user?.email ?? "Unknown",
      phone: null as string | null,
      role: m.role,
      isFullTime: true,
      hourlyRate: null as number | null,
      dailyRate: null as number | null,
      skills: [] as string[],
      isActive: m.isActive,
      rating: null,
    }));
  }, [members]);

  const filteredStaff = useMemo(() => {
    let result = staffList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((s) => s.role === roleFilter);
    }
    return result;
  }, [staffList, searchQuery, roleFilter]);

  // Stats
  const totalStaff = staffList.length;
  const upcomingShifts = 0; // Would require a dedicated query
  const checkedInToday = availability?.filter((s) => !s.isAvailable).length ?? 0;
  const noShowRate = 0;

  // Events for assignment dialog
  const upcomingEvents = useMemo(() => {
    if (!events?.events) return [];
    const now = new Date();
    return events.events
      .filter((e: { eventDate: Date; status: string }) => {
        const d = new Date(e.eventDate);
        return d >= now && !["cancelled", "completed", "settled"].includes(e.status);
      })
      .sort((a: { eventDate: Date }, b: { eventDate: Date }) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 20);
  }, [events]);

  const handleAssign = useCallback((staffId: string) => {
    setSelectedStaffId(staffId);
    setAssignDialogOpen(true);
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loadingMembers) return <StaffSkeleton />;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardPageHeader
        title="Gestion du Staff"
        description="G\u00e9rez votre \u00e9quipe, planifiez les affectations et suivez la pr\u00e9sence."
        icon={<Users className="h-6 w-6" />}
        actions={
          <Button
            onClick={() => {
              setSelectedStaffId(null);
              setAssignDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Assigner Staff
          </Button>
        }
      />

      {/* Stats */}
      <StatsBar
        totalStaff={totalStaff}
        upcomingShifts={upcomingShifts}
        checkedInToday={checkedInToday}
        noShowRate={noShowRate}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="roster" className="text-xs">
            <Users className="h-3.5 w-3.5 mr-1" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="availability" className="text-xs">
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            Disponibilit\u00e9
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Pr\u00e9sence
          </TabsTrigger>
        </TabsList>

        {/* ── Roster Tab ── */}
        <TabsContent value="roster" className="space-y-4 mt-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou r\u00f4le..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les r\u00f4les" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les r\u00f4les</SelectItem>
                {STAFF_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_CONFIG[role].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Grid */}
          {filteredStaff.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery || roleFilter !== "all"
                    ? "Aucun membre trouv\u00e9 avec ces crit\u00e8res."
                    : "Aucun membre d'\u00e9quipe pour le moment."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStaff.map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  onAssign={handleAssign}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Availability Tab ── */}
        <TabsContent value="availability" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AvailabilityView
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />

            {/* Upcoming events needing staff */}
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gold" />
                  \u00c9v\u00e9nements \u00e0 Venir
                </h3>
                {loadingEvents ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Aucun \u00e9v\u00e9nement \u00e0 venir.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {upcomingEvents.map((event: { id: string; title: string | null; eventDate: Date; guestCount: number | null; status: string }) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium line-clamp-1">
                            {event.title || "Sans titre"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(event.eventDate)} &middot; {event.guestCount} invit\u00e9s
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[9px] ml-2">
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Attendance Tab ── */}
        <TabsContent value="attendance" className="mt-4">
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sage" />
                Suivi de Pr\u00e9sence
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Pointez l&apos;arriv\u00e9e et le d\u00e9part du staff pour chaque \u00e9v\u00e9nement.
                S\u00e9lectionnez un \u00e9v\u00e9nement pour voir les affectations.
              </p>

              {/* Event picker for attendance */}
              {upcomingEvents.length > 0 && (
                <AttendancePanel
                  events={upcomingEvents}
                  onCheckIn={(id) => checkInMutation.mutate({ assignmentId: id })}
                  onCheckOut={(id) => checkOutMutation.mutate({ assignmentId: id })}
                  onRemove={(id) => removeMutation.mutate({ assignmentId: id })}
                />
              )}

              {upcomingEvents.length === 0 && (
                <div className="text-center py-8">
                  <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucun \u00e9v\u00e9nement actif pour le suivi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <AssignStaffDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        events={upcomingEvents}
        staffId={selectedStaffId}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attendance Panel (selects event, shows assignments)
// ---------------------------------------------------------------------------

function AttendancePanel({
  events,
  onCheckIn,
  onCheckOut,
  onRemove,
}: {
  events: Array<{ id: string; title: string | null; eventDate: Date | string }>;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");

  const { data: assignments, isLoading } = api.staffScheduling.getByEvent.useQuery(
    { eventId: selectedEventId },
    { enabled: !!selectedEventId }
  );

  return (
    <div className="space-y-3">
      <Select value={selectedEventId} onValueChange={setSelectedEventId}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir un \u00e9v\u00e9nement..." />
        </SelectTrigger>
        <SelectContent>
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              {event.title || "Sans titre"} - {formatDate(event.eventDate)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : !assignments || assignments.length === 0 ? (
        <div className="text-center py-6">
          <UserX className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">
            Aucune affectation pour cet \u00e9v\u00e9nement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment as unknown as AssignmentRow}
              onCheckIn={onCheckIn}
              onCheckOut={onCheckOut}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
