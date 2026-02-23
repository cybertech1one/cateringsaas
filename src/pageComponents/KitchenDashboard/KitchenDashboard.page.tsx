"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Progress } from "~/components/ui/progress";
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
  ChefHat,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Truck,
  ClipboardList,
  Package,
  Play,
  Pause,
  SkipForward,
  Timer,
  TrendingUp,
  Filter,
  LayoutGrid,
  List,
  FileText,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";
import { Skeleton } from "~/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TASK_CATEGORIES = [
  "shopping",
  "prep",
  "cooking",
  "assembly",
  "packing",
  "transport",
  "setup",
  "service",
  "teardown",
  "cleanup",
] as const;

type TaskCategory = (typeof TASK_CATEGORIES)[number];

const TASK_STATUSES = ["pending", "in_progress", "completed", "skipped"] as const;
type TaskStatus = (typeof TASK_STATUSES)[number];

const TEMPLATES = ["wedding", "corporate", "ramadan_iftar", "birthday", "basic"] as const;
type TemplateName = (typeof TEMPLATES)[number];

const CATEGORY_CONFIG: Record<TaskCategory, { label: string; icon: typeof ChefHat; color: string; bg: string }> = {
  shopping: { label: "Courses", icon: Package, color: "text-[hsl(var(--majorelle-blue))]", bg: "bg-[hsl(var(--majorelle-blue))]/10" },
  prep: { label: "Pr\u00e9paration", icon: ClipboardList, color: "text-[hsl(var(--saffron))]", bg: "bg-[hsl(var(--saffron))]/10" },
  cooking: { label: "Cuisson", icon: ChefHat, color: "text-terracotta", bg: "bg-terracotta/10" },
  assembly: { label: "Assemblage", icon: Package, color: "text-sage", bg: "bg-sage/10" },
  packing: { label: "Emballage", icon: Package, color: "text-gold", bg: "bg-gold/10" },
  transport: { label: "Transport", icon: Truck, color: "text-[hsl(var(--zellige-teal))]", bg: "bg-[hsl(var(--zellige-teal))]/10" },
  setup: { label: "Installation", icon: LayoutGrid, color: "text-primary", bg: "bg-primary/10" },
  service: { label: "Service", icon: ChefHat, color: "text-[hsl(var(--mint-tea))]", bg: "bg-[hsl(var(--mint-tea))]/10" },
  teardown: { label: "D\u00e9montage", icon: Package, color: "text-muted-foreground", bg: "bg-muted" },
  cleanup: { label: "Nettoyage", icon: Package, color: "text-muted-foreground", bg: "bg-muted" },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; dotColor: string }> = {
  pending: { label: "A faire", color: "text-[hsl(var(--majorelle-blue))]", bg: "bg-[hsl(var(--majorelle-blue))]/8 border-[hsl(var(--majorelle-blue))]/20", dotColor: "bg-[hsl(var(--majorelle-blue))]" },
  in_progress: { label: "En cours", color: "text-[hsl(var(--saffron))]", bg: "bg-[hsl(var(--saffron))]/8 border-[hsl(var(--saffron))]/20", dotColor: "bg-[hsl(var(--saffron))]" },
  completed: { label: "Termin\u00e9", color: "text-sage", bg: "bg-sage/8 border-sage/20", dotColor: "bg-sage" },
  skipped: { label: "Pass\u00e9", color: "text-muted-foreground", bg: "bg-muted border-border", dotColor: "bg-muted-foreground" },
};

const TEMPLATE_CONFIG: Record<TemplateName, { label: string; description: string; taskCount: number }> = {
  wedding: { label: "Mariage", description: "Plan complet pour un mariage traditionnel", taskCount: 16 },
  corporate: { label: "Corporate", description: "\u00c9v\u00e9nement d\u2019entreprise standard", taskCount: 8 },
  ramadan_iftar: { label: "Iftar Ramadan", description: "Service iftar avec sp\u00e9cialit\u00e9s", taskCount: 9 },
  birthday: { label: "Anniversaire", description: "F\u00eate d\u2019anniversaire avec g\u00e2teau", taskCount: 8 },
  basic: { label: "Basique", description: "Service traiteur simple", taskCount: 6 },
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

function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-MA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Status badge for tasks */
function TaskStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as TaskStatus] ?? STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={cn("gap-1.5 text-[11px] font-medium border", config.bg, config.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </Badge>
  );
}

/** Category badge */
function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category as TaskCategory] ?? CATEGORY_CONFIG.prep;
  return (
    <Badge variant="secondary" className={cn("text-[10px] font-medium", config.bg, config.color)}>
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Stats Bar
// ---------------------------------------------------------------------------

function KitchenStatsBar({
  tasksToday,
  overdue,
  completionRate,
  inProgress,
}: {
  tasksToday: number;
  overdue: number;
  completionRate: number;
  inProgress: number;
}) {
  const items = [
    {
      label: "T\u00e2ches Aujourd'hui",
      value: tasksToday,
      icon: ClipboardList,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "En cours",
      value: inProgress,
      icon: Timer,
      color: "text-[hsl(var(--saffron))]",
      bg: "bg-[hsl(var(--saffron))]/10",
    },
    {
      label: "En retard",
      value: overdue,
      icon: AlertTriangle,
      color: overdue > 0 ? "text-destructive" : "text-sage",
      bg: overdue > 0 ? "bg-destructive/10" : "bg-sage/10",
    },
    {
      label: "Compl\u00e9tion",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: "text-sage",
      bg: "bg-sage/10",
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
// Task Card
// ---------------------------------------------------------------------------

type PrepTask = {
  id: string;
  name: string;
  category: string;
  assignedTo: string[];
  startTime: Date | string | null;
  endTime: Date | string | null;
  durationMinutes: number | null;
  status: string;
  notes: string | null;
  sortOrder: number;
};

function TaskCard({
  task,
  onStatusChange,
}: {
  task: PrepTask;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}) {
  const statusConfig = STATUS_CONFIG[task.status as TaskStatus] ?? STATUS_CONFIG.pending;
  const catConfig = CATEGORY_CONFIG[task.category as TaskCategory] ?? CATEGORY_CONFIG.prep;
  const CatIcon = catConfig.icon;

  const isOverdue = useMemo(() => {
    if (task.status === "completed" || task.status === "skipped") return false;
    if (!task.endTime) return false;
    return new Date(task.endTime) < new Date();
  }, [task.endTime, task.status]);

  return (
    <Card className={cn(
      "border shadow-sm transition-all hover:shadow-md",
      isOverdue && "border-destructive/40 bg-destructive/5",
    )}>
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", catConfig.bg)}>
              <CatIcon className={cn("h-3.5 w-3.5", catConfig.color)} />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-tight line-clamp-1">
                {task.name}
              </h4>
              <CategoryBadge category={task.category} />
            </div>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>

        {/* Details */}
        <div className="text-xs text-muted-foreground space-y-0.5 mb-2">
          {task.durationMinutes && (
            <p className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {task.durationMinutes} min
            </p>
          )}
          {(task.startTime || task.endTime) && (
            <p className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(task.startTime)} - {formatDateTime(task.endTime)}
            </p>
          )}
          {task.assignedTo.length > 0 && (
            <p className="flex items-center gap-1">
              <ChefHat className="h-3 w-3" />
              {task.assignedTo.join(", ")}
            </p>
          )}
          {isOverdue && (
            <p className="flex items-center gap-1 text-destructive font-medium">
              <AlertTriangle className="h-3 w-3" />
              En retard
            </p>
          )}
        </div>

        {task.notes && (
          <p className="text-[10px] text-muted-foreground/80 line-clamp-2 mb-2 italic">
            {task.notes}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-1.5">
          {task.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs text-[hsl(var(--saffron))] border-[hsl(var(--saffron))]/30 hover:bg-[hsl(var(--saffron))]/10"
              onClick={() => onStatusChange(task.id, "in_progress")}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              D\u00e9marrer
            </Button>
          )}
          {task.status === "in_progress" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-sage border-sage/30 hover:bg-sage/10"
                onClick={() => onStatusChange(task.id, "completed")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Terminer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:bg-muted"
                onClick={() => onStatusChange(task.id, "pending")}
              >
                <Pause className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {(task.status === "pending" || task.status === "in_progress") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:bg-muted"
              onClick={() => onStatusChange(task.id, "skipped")}
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Kanban Board (grouped by status)
// ---------------------------------------------------------------------------

function KanbanBoard({
  tasks,
  onStatusChange,
}: {
  tasks: PrepTask[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}) {
  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: "pending", label: "A faire", color: "border-[hsl(var(--majorelle-blue))]/50" },
    { status: "in_progress", label: "En cours", color: "border-[hsl(var(--saffron))]/50" },
    { status: "completed", label: "Termin\u00e9", color: "border-sage/50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="space-y-2">
            <div className={cn("flex items-center justify-between p-2 rounded-lg border-l-4", col.color, "bg-muted/30")}>
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {colTasks.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {colTasks.length === 0 ? (
                <div className="flex items-center justify-center h-20 rounded-lg border border-dashed text-xs text-muted-foreground">
                  Aucune t\u00e2che
                </div>
              ) : (
                colTasks
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={onStatusChange}
                    />
                  ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Library
// ---------------------------------------------------------------------------

function TemplateLibrary({
  eventId,
  onApply,
  isApplying,
}: {
  eventId: string;
  onApply: (template: TemplateName) => void;
  isApplying: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TEMPLATES.map((template) => {
        const config = TEMPLATE_CONFIG[template];
        return (
          <Card key={template} className="border shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-1">{config.label}</h4>
              <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">
                  {config.taskCount} t\u00e2ches
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onApply(template)}
                  disabled={isApplying || !eventId}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Appliquer
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Task Dialog
// ---------------------------------------------------------------------------

function CreateTaskDialog({
  open,
  onOpenChange,
  eventId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}) {
  const { toast } = useToast();
  const utils = api.useContext();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("prep");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = api.timeline.createTask.useMutation({
    onSuccess: () => {
      toast({ title: "T\u00e2che cr\u00e9\u00e9e avec succ\u00e8s" });
      void utils.timeline.invalidate();
      onOpenChange(false);
      setName("");
      setCategory("prep");
      setDurationMinutes("");
      setNotes("");
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !eventId) return;
    createMutation.mutate({
      eventId,
      name: name.trim(),
      category: category as TaskCategory,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Nouvelle T\u00e2che
          </DialogTitle>
          <DialogDescription>
            Ajoutez une t\u00e2che de pr\u00e9paration pour cet \u00e9v\u00e9nement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nom de la t\u00e2che</Label>
            <Input
              placeholder="Ex: Pr\u00e9parer la harira..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cat\u00e9gorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Dur\u00e9e (minutes)</Label>
            <Input
              type="number"
              placeholder="Ex: 120"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea
              placeholder="Instructions suppl\u00e9mentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createMutation.isLoading}
          >
            {createMutation.isLoading ? "En cours..." : "Cr\u00e9er"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function KitchenSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function KitchenDashboard() {
  const { toast } = useToast();
  const utils = api.useContext();
  const [activeTab, setActiveTab] = useState("board");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  // ── Queries ──────────────────────────────────────────────────────────
  const { data: events, isLoading: loadingEvents } = api.events.list.useQuery({});

  // Upcoming/active events for the event picker
  const activeEvents = useMemo(() => {
    if (!events?.events) return [];
    return events.events
      .filter((e: { status: string }) => !["cancelled", "completed", "settled"].includes(e.status))
      .sort((a: { eventDate: Date }, b: { eventDate: Date }) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [events]);

  // Auto-select first event
  const eventId = selectedEventId || activeEvents[0]?.id || "";

  const { data: tasks, isLoading: loadingTasks } = api.timeline.getByEvent.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  const { data: progress } = api.timeline.getProgress.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  const { data: deliveryPlan } = api.timeline.getDeliveryPlan.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  // ── Mutations ────────────────────────────────────────────────────────
  const updateStatusMutation = api.timeline.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: "Statut mis \u00e0 jour" });
      void utils.timeline.invalidate();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const applyTemplateMutation = api.timeline.applyTemplate.useMutation({
    onSuccess: (data) => {
      toast({ title: `Template appliqu\u00e9: ${data.count} t\u00e2ches cr\u00e9\u00e9es` });
      void utils.timeline.invalidate();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      updateStatusMutation.mutate({ taskId, status: newStatus });
    },
    [updateStatusMutation]
  );

  const handleApplyTemplate = useCallback(
    (template: TemplateName) => {
      if (!eventId) return;
      applyTemplateMutation.mutate({ eventId, template });
    },
    [eventId, applyTemplateMutation]
  );

  // ── Derived data ─────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const typedTasks = tasks as unknown as PrepTask[];
    if (categoryFilter === "all") return typedTasks;
    return typedTasks.filter((t) => t.category === categoryFilter);
  }, [tasks, categoryFilter]);

  const statsToday = useMemo(() => {
    const allTasks = (tasks as unknown as PrepTask[]) ?? [];
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "completed").length;
    const inProg = allTasks.filter((t) => t.status === "in_progress").length;
    const overdue = allTasks.filter((t) => {
      if (t.status === "completed" || t.status === "skipped") return false;
      if (!t.endTime) return false;
      return new Date(t.endTime) < new Date();
    }).length;
    return {
      total,
      completed,
      inProgress: inProg,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loadingEvents) return <KitchenSkeleton />;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardPageHeader
        title="Cuisine & Pr\u00e9paration"
        description="Planifiez, suivez et g\u00e9rez toutes les t\u00e2ches de pr\u00e9paration pour vos \u00e9v\u00e9nements."
        icon={<ChefHat className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}
            >
              {viewMode === "board" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
              disabled={!eventId}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle T\u00e2che
            </Button>
          </div>
        }
      />

      {/* Event Selector + Stats */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={eventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="S\u00e9lectionner un \u00e9v\u00e9nement..." />
          </SelectTrigger>
          <SelectContent>
            {activeEvents.map((event: { id: string; title: string | null; eventDate: Date }) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title || "Sans titre"} - {formatDate(event.eventDate)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Toutes les cat\u00e9gories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes cat\u00e9gories</SelectItem>
            {TASK_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <KitchenStatsBar
        tasksToday={statsToday.total}
        overdue={statsToday.overdue}
        completionRate={statsToday.completionRate}
        inProgress={statsToday.inProgress}
      />

      {/* Progress bar */}
      {progress && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Progression globale</h3>
              <span className="text-sm font-bold text-sage">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2.5" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {Object.entries(progress.byCategory).map(([cat, data]) => {
                const catConfig = CATEGORY_CONFIG[cat as TaskCategory];
                return (
                  <span key={cat} className="text-[10px] text-muted-foreground">
                    {catConfig?.label ?? cat}: {data.completed}/{data.total}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="board" className="text-xs">
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            Tableau
          </TabsTrigger>
          <TabsTrigger value="delivery" className="text-xs">
            <Truck className="h-3.5 w-3.5 mr-1" />
            Livraison
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">
            <FileText className="h-3.5 w-3.5 mr-1" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* ── Board Tab ── */}
        <TabsContent value="board" className="mt-4">
          {!eventId ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  S\u00e9lectionnez un \u00e9v\u00e9nement pour voir les t\u00e2ches.
                </p>
              </CardContent>
            </Card>
          ) : loadingTasks ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-36 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Aucune t\u00e2che pour cet \u00e9v\u00e9nement.
                </p>
                <p className="text-xs text-muted-foreground">
                  Utilisez les templates ou cr\u00e9ez des t\u00e2ches manuellement.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === "board" ? (
            <KanbanBoard tasks={filteredTasks} onStatusChange={handleStatusChange} />
          ) : (
            <div className="space-y-2">
              {filteredTasks
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        {/* ── Delivery Tab ── */}
        <TabsContent value="delivery" className="mt-4">
          {!eventId ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  S\u00e9lectionnez un \u00e9v\u00e9nement pour voir le plan de livraison.
                </p>
              </CardContent>
            </Card>
          ) : !deliveryPlan ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Aucun plan de livraison pour cet \u00e9v\u00e9nement.
                </p>
                <p className="text-xs text-muted-foreground">
                  Le plan sera cr\u00e9\u00e9 lors de la confirmation de l&apos;\u00e9v\u00e9nement.
                </p>
              </CardContent>
            </Card>
          ) : (
            <DeliveryPlanView plan={deliveryPlan} />
          )}
        </TabsContent>

        {/* ── Templates Tab ── */}
        <TabsContent value="templates" className="mt-4">
          {!eventId ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  S\u00e9lectionnez un \u00e9v\u00e9nement pour appliquer un template.
                </p>
              </CardContent>
            </Card>
          ) : (
            <TemplateLibrary
              eventId={eventId}
              onApply={handleApplyTemplate}
              isApplying={applyTemplateMutation.isLoading}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        eventId={eventId}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delivery Plan View
// ---------------------------------------------------------------------------

type DeliveryPlanData = {
  id: string;
  eventId: string;
  vehicleType: string | null;
  driverName: string | null;
  driverPhone: string | null;
  loadingStartTime: Date | string | null;
  departureTime: Date | string | null;
  estimatedArrival: Date | string | null;
  setupStartTime: Date | string | null;
  serviceStartTime: Date | string | null;
  serviceEndTime: Date | string | null;
  teardownEndTime: Date | string | null;
  returnTime: Date | string | null;
  foodManifest: unknown;
  equipmentManifest: unknown;
  notes: string | null;
};

function DeliveryPlanView({ plan }: { plan: unknown }) {
  const p = plan as DeliveryPlanData;

  const timelineSteps = [
    { label: "Chargement", time: p.loadingStartTime, icon: Package },
    { label: "D\u00e9part", time: p.departureTime, icon: Truck },
    { label: "Arriv\u00e9e (est.)", time: p.estimatedArrival, icon: CalendarDays },
    { label: "Installation", time: p.setupStartTime, icon: LayoutGrid },
    { label: "D\u00e9but Service", time: p.serviceStartTime, icon: ChefHat },
    { label: "Fin Service", time: p.serviceEndTime, icon: CheckCircle2 },
    { label: "D\u00e9montage", time: p.teardownEndTime, icon: Package },
    { label: "Retour", time: p.returnTime, icon: Truck },
  ];

  return (
    <div className="space-y-4">
      {/* Driver info */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-[hsl(var(--zellige-teal))]" />
            Informations Chauffeur
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Chauffeur:</span>
              <p className="font-medium">{p.driverName || "Non assign\u00e9"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">T\u00e9l\u00e9phone:</span>
              <p className="font-medium">{p.driverPhone || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">V\u00e9hicule:</span>
              <p className="font-medium">{p.vehicleType || "Non sp\u00e9cifi\u00e9"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            Timeline de Livraison
          </h3>
          <div className="space-y-3">
            {timelineSteps.map((step, index) => {
              const StepIcon = step.icon;
              const hasTime = !!step.time;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      hasTime ? "bg-sage/15 text-sage" : "bg-muted text-muted-foreground"
                    )}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    {index < timelineSteps.length - 1 && (
                      <div className={cn("w-px h-4 mt-1", hasTime ? "bg-sage/40" : "bg-border")} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-xs font-medium">{step.label}</p>
                    <p className={cn("text-[10px]", hasTime ? "text-sage font-medium" : "text-muted-foreground")}>
                      {hasTime ? formatDateTime(step.time) : "Non planifi\u00e9"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {p.notes && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">Notes</h3>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{p.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
