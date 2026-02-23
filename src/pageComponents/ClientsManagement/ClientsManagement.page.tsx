"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
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
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  Users,
  Download,
  MessageSquare,
  Star,
  Building2,
  RefreshCcw,
  Sparkles,
  ChevronRight,
  Calendar,
  Tag,
  StickyNote,
  Edit3,
  X,
  UserPlus,
  FileText,
  Globe,
  Loader2,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientProfile = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
  tags: string[];
  notes: string | null;
  totalEventsBooked: number;
  preferredLanguage: string | null;
};

type ClientEvent = {
  id: string;
  title: string;
  eventType: string;
  status: string;
  eventDate: string;
  guestCount: number | null;
  totalAmount: number | null;
};

type ClientDetail = ClientProfile & {
  events: ClientEvent[];
  createdAt: string;
};

type SortBy = "name" | "events" | "created";

type PreferredLanguage = "ar" | "fr" | "en";

type DialogMode = "closed" | "add" | "edit" | "detail";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGES: { value: PreferredLanguage; label: string }[] = [
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "en", label: "English" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "events", label: "Events" },
  { value: "created", label: "Newest" },
];

const TAG_COLORS: Record<string, string> = {
  vip: "bg-gold/10 text-gold border-gold/30",
  corporate: "bg-[hsl(var(--majorelle-blue))]/10 text-[hsl(var(--majorelle-blue))] border-[hsl(var(--majorelle-blue))]/30",
  repeat: "bg-sage/10 text-sage border-sage/30",
  new: "bg-primary/10 text-primary border-primary/30",
  wedding: "bg-[hsl(var(--rose-petal))]/10 text-[hsl(var(--rose-petal))] border-[hsl(var(--rose-petal))]/30",
  ramadan: "bg-[hsl(var(--mint-tea))]/10 text-[hsl(var(--mint-tea))] border-[hsl(var(--mint-tea))]/30",
  government: "bg-muted text-muted-foreground border-border",
  nonprofit: "bg-[hsl(var(--zellige-teal))]/10 text-[hsl(var(--zellige-teal))] border-[hsl(var(--zellige-teal))]/30",
};

const DEFAULT_TAG_COLOR = "bg-muted text-muted-foreground border-border";

function getTagColor(tag: string): string {
  const key = tag.toLowerCase().trim();
  return TAG_COLORS[key] ?? DEFAULT_TAG_COLOR;
}

// ---------------------------------------------------------------------------
// Segment Card
// ---------------------------------------------------------------------------

function SegmentCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className={cn("text-2xl font-bold mt-1", colorClass)}>
              {value}
            </p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              colorClass.replace("text-", "bg-").replace("600", "100").replace("500", "100"),
            )}
          >
            <Icon className={cn("h-5 w-5", colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Client Card
// ---------------------------------------------------------------------------

function ClientCard({
  client,
  onClick,
}: {
  client: ClientProfile;
  onClick: () => void;
}) {
  const isVip = client.tags.some((t) => t.toLowerCase() === "vip");
  const isCorporate = client.tags.some((t) => t.toLowerCase() === "corporate");

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer group",
        isVip && "border-l-4 border-l-amber-400",
        isCorporate && !isVip && "border-l-4 border-l-blue-400",
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Name + Tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{client.name}</h3>
              {isVip && (
                <Star className="h-3.5 w-3.5 text-gold fill-gold shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {client.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 h-5 border", getTagColor(tag))}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Right: Event count + Arrow */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <span className="text-lg font-bold">
                {client.totalEventsBooked}
              </span>
              <p className="text-[10px] text-muted-foreground leading-tight">
                events
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-3 pt-3 border-t">
          {client.phone && (
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.whatsapp && (
            <div className="flex items-center gap-1.5 truncate">
              <MessageSquare className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.whatsapp}</span>
            </div>
          )}
          {client.city && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.city}</span>
            </div>
          )}
          {client.preferredLanguage && (
            <div className="flex items-center gap-1.5 truncate">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {LANGUAGES.find((l) => l.value === client.preferredLanguage)?.label ??
                  client.preferredLanguage}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No clients yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        Start building your client base. Add your first client to track events,
        preferences, and communication history.
      </p>
      <Button className="mt-6 gap-2" onClick={onAdd}>
        <UserPlus className="h-4 w-4" />
        Add your first client
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// No Results State
// ---------------------------------------------------------------------------

function NoResults({ search, onClear }: { search: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <h3 className="text-sm font-semibold">No clients match your search</h3>
      <p className="text-xs text-muted-foreground mt-1">
        No results for &quot;{search}&quot;. Try a different search term.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag Filter Pills
// ---------------------------------------------------------------------------

function TagFilterPills({
  allTags,
  activeTags,
  onToggle,
}: {
  allTags: string[];
  activeTags: string[];
  onToggle: (tag: string) => void;
}) {
  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {allTags.map((tag) => {
        const isActive = activeTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
              isActive
                ? cn(getTagColor(tag), "ring-1 ring-offset-1 ring-current")
                : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            <Tag className="h-3 w-3" />
            {tag}
            {isActive && <X className="h-3 w-3 ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client Form (for Add / Edit)
// ---------------------------------------------------------------------------

type ClientFormData = {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  city: string;
  preferredLanguage: string;
  tags: string;
  notes: string;
};

const INITIAL_FORM: ClientFormData = {
  name: "",
  phone: "",
  email: "",
  whatsapp: "",
  city: "",
  preferredLanguage: "",
  tags: "",
  notes: "",
};

function clientToForm(client: ClientProfile): ClientFormData {
  return {
    name: client.name,
    phone: client.phone ?? "",
    email: client.email ?? "",
    whatsapp: client.whatsapp ?? "",
    city: client.city ?? "",
    preferredLanguage: client.preferredLanguage ?? "",
    tags: client.tags.join(", "),
    notes: client.notes ?? "",
  };
}

function ClientFormDialog({
  mode,
  initialData,
  onClose,
  onSave,
  isSaving,
}: {
  mode: "add" | "edit";
  initialData: ClientFormData;
  onClose: () => void;
  onSave: (data: ClientFormData) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<ClientFormData>(initialData);

  const updateField = useCallback(
    (field: keyof ClientFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const isValid = form.name.trim().length > 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Client" : "Edit Client"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Enter the client details to add them to your CRM."
              : "Update the client information."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (required) */}
          <div className="space-y-1.5">
            <Label htmlFor="client-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              placeholder="Full name or company"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              autoFocus
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                placeholder="+212 6XX XXX XXX"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                placeholder="email@example.com"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </div>

          {/* WhatsApp + City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-whatsapp">WhatsApp</Label>
              <Input
                id="client-whatsapp"
                placeholder="+212 6XX XXX XXX"
                value={form.whatsapp}
                onChange={(e) => updateField("whatsapp", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-city">City</Label>
              <Input
                id="client-city"
                placeholder="e.g. Casablanca"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <Label>Preferred Language</Label>
            <Select
              value={form.preferredLanguage}
              onValueChange={(v) => updateField("preferredLanguage", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language..." />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="client-tags">Tags</Label>
            <Input
              id="client-tags"
              placeholder="Comma-separated: VIP, Corporate, Wedding"
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="client-notes">Notes</Label>
            <Textarea
              id="client-notes"
              placeholder="Internal notes about this client..."
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "add" ? "Add Client" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Event History Table
// ---------------------------------------------------------------------------

function EventHistoryTable({ events }: { events: ClientEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-4 text-center">
        No events yet for this client.
      </p>
    );
  }

  function formatStatus(status: string) {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function statusColor(status: string) {
    switch (status) {
      case "completed":
      case "settled":
        return "bg-sage/10 text-sage";
      case "confirmed":
      case "deposit_paid":
        return "bg-[hsl(var(--majorelle-blue))]/10 text-[hsl(var(--majorelle-blue))]";
      case "cancelled":
      case "declined":
        return "bg-destructive/10 text-destructive";
      case "inquiry":
      case "reviewed":
        return "bg-gold/10 text-gold";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  function formatAmount(amount: number | null) {
    if (amount == null) return "-";
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-1 font-medium text-muted-foreground">
              Event
            </th>
            <th className="text-left py-2 px-1 font-medium text-muted-foreground">
              Type
            </th>
            <th className="text-left py-2 px-1 font-medium text-muted-foreground">
              Date
            </th>
            <th className="text-right py-2 px-1 font-medium text-muted-foreground">
              Guests
            </th>
            <th className="text-right py-2 px-1 font-medium text-muted-foreground">
              Amount
            </th>
            <th className="text-center py-2 px-1 font-medium text-muted-foreground">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2 px-1 font-medium max-w-[120px] truncate">
                {event.title}
              </td>
              <td className="py-2 px-1 capitalize">{event.eventType.replace(/_/g, " ")}</td>
              <td className="py-2 px-1 whitespace-nowrap">
                {new Date(event.eventDate).toLocaleDateString("fr-MA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-2 px-1 text-right">
                {event.guestCount ?? "-"}
              </td>
              <td className="py-2 px-1 text-right whitespace-nowrap">
                {formatAmount(event.totalAmount)}
              </td>
              <td className="py-2 px-1 text-center">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0", statusColor(event.status))}
                >
                  {formatStatus(event.status)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client Detail Dialog
// ---------------------------------------------------------------------------

function ClientDetailDialog({
  clientId,
  onClose,
  onEdit,
}: {
  clientId: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { toast } = useToast();
  const ctx = api.useContext();

  const { data: client, isLoading } = api.clients.getById.useQuery(
    { clientId },
    { enabled: !!clientId },
  );

  // ------ Add Note ------
  const [newNote, setNewNote] = useState("");
  const addNoteMutation = api.clients.addNote.useMutation({
    onSuccess: () => {
      toast({ title: "Note added", description: "Client note saved." });
      setNewNote("");
      void ctx.clients.getById.invalidate({ clientId });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ------ Tag Management ------
  const [tagInput, setTagInput] = useState("");
  const updateTagsMutation = api.clients.updateTags.useMutation({
    onSuccess: () => {
      toast({ title: "Tags updated" });
      void ctx.clients.getById.invalidate({ clientId });
      void ctx.clients.list.invalidate();
      void ctx.clients.getTags.invalidate();
      void ctx.clients.getSegments.invalidate();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleAddTag = () => {
    if (!tagInput.trim() || !client) return;
    const newTags = [...client.tags, tagInput.trim()];
    updateTagsMutation.mutate({ clientId, tags: newTags });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!client) return;
    const newTags = client.tags.filter((t: string) => t !== tagToRemove);
    updateTagsMutation.mutate({ clientId, tags: newTags });
  };

  const handleSubmitNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({ clientId, note: newNote.trim() });
  };

  const detail = client as ClientDetail | undefined;

  const isVip = detail?.tags.some((t: string) => t.toLowerCase() === "vip");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading || !detail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">{detail.name}</DialogTitle>
                  {isVip && (
                    <Star className="h-4 w-4 text-gold fill-gold" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={onEdit}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
              <DialogDescription>
                Client since{" "}
                {detail.createdAt
                  ? new Date(detail.createdAt).toLocaleDateString("fr-MA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
                {" "}&middot;{" "}
                {detail.totalEventsBooked} event
                {detail.totalEventsBooked !== 1 ? "s" : ""} booked
              </DialogDescription>
            </DialogHeader>

            {/* Contact Info */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {detail.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${detail.phone}`}
                        className="hover:underline"
                      >
                        {detail.phone}
                      </a>
                    </div>
                  )}
                  {detail.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${detail.email}`}
                        className="hover:underline truncate"
                      >
                        {detail.email}
                      </a>
                    </div>
                  )}
                  {detail.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={`https://wa.me/${detail.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {detail.whatsapp}
                      </a>
                    </div>
                  )}
                  {detail.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{detail.city}</span>
                    </div>
                  )}
                  {detail.preferredLanguage && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {LANGUAGES.find((l) => l.value === detail.preferredLanguage)
                          ?.label ?? detail.preferredLanguage}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Tags
                </h4>
                <div className="flex flex-wrap items-center gap-1.5">
                  {detail.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn(
                        "text-xs px-2 py-0.5 border gap-1",
                        getTagColor(tag),
                      )}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive ml-0.5"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag..."
                      className="h-7 w-28 text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || updateTagsMutation.isLoading}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Event History */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Event History
                </h4>
                <Card>
                  <CardContent className="p-3">
                    <EventHistoryTable events={(detail.events ?? []) as ClientEvent[]} />
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Notes
                </h4>
                {detail.notes && (
                  <Card className="mb-3">
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
                    </CardContent>
                  </Card>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note about this client..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 self-end gap-1.5"
                    onClick={handleSubmitNote}
                    disabled={!newNote.trim() || addNoteMutation.isLoading}
                  >
                    {addNoteMutation.isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <StickyNote className="h-3.5 w-3.5" />
                    )}
                    Add Note
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ClientsManagement() {
  const { toast } = useToast();
  const ctx = api.useContext();

  // ------ Dialog State ------
  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);

  // ------ Filters ------
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("created");

  // ------ Data Queries ------
  const {
    data: clientsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.clients.list.useInfiniteQuery(
    {
      search: search || undefined,
      tags: activeTags.length > 0 ? activeTags : undefined,
      sortBy,
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const { data: segments } = api.clients.getSegments.useQuery({});
  const { data: allTags } = api.clients.getTags.useQuery({});

  // ------ Mutations ------
  const createMutation = api.clients.create.useMutation({
    onSuccess: () => {
      toast({ title: "Client added", description: "New client created successfully." });
      setDialogMode("closed");
      void ctx.clients.list.invalidate();
      void ctx.clients.getSegments.invalidate();
      void ctx.clients.getTags.invalidate();
    },
    onError: (err) => {
      toast({
        title: "Error creating client",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.clients.update.useMutation({
    onSuccess: () => {
      toast({ title: "Client updated", description: "Changes saved." });
      setDialogMode("closed");
      setEditingClient(null);
      void ctx.clients.list.invalidate();
      void ctx.clients.getSegments.invalidate();
      void ctx.clients.getTags.invalidate();
      if (selectedClientId) {
        void ctx.clients.getById.invalidate({ clientId: selectedClientId });
      }
    },
    onError: (err) => {
      toast({
        title: "Error updating client",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const [isExporting, setIsExporting] = useState(false);
  const exportQuery = api.clients.exportCSV.useQuery(
    {},
    { enabled: false },
  );

  // ------ Computed ------
  const clients = useMemo(() => {
    if (!clientsData?.pages) return [];
    return clientsData.pages.flatMap((page) => page.clients) as ClientProfile[];
  }, [clientsData]);

  const totalClients = segments?.total ?? 0;

  // ------ Handlers ------
  const handleToggleTag = useCallback((tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleOpenDetail = useCallback((client: ClientProfile) => {
    setSelectedClientId(client.id);
    setDialogMode("detail");
  }, []);

  const handleOpenAdd = useCallback(() => {
    setEditingClient(null);
    setDialogMode("add");
  }, []);

  const handleOpenEdit = useCallback(() => {
    // Switching from detail to edit: we need to find the client data
    // from the list (detail dialog will close and edit will open)
    const client = clients.find((c) => c.id === selectedClientId);
    if (client) {
      setEditingClient(client);
      setDialogMode("edit");
    }
  }, [clients, selectedClientId]);

  const handleCloseDialog = useCallback(() => {
    setDialogMode("closed");
    setSelectedClientId(null);
    setEditingClient(null);
  }, []);

  const parseTags = (tagsString: string): string[] =>
    tagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const handleSaveClient = useCallback(
    (data: ClientFormData) => {
      const tags = parseTags(data.tags);

      const lang = data.preferredLanguage as PreferredLanguage | "";

      if (dialogMode === "add") {
        createMutation.mutate({
          name: data.name.trim(),
          phone: data.phone || undefined,
          email: data.email || undefined,
          whatsapp: data.whatsapp || undefined,
          city: data.city || undefined,
          preferredLanguage: lang || undefined,
          tags: tags.length > 0 ? tags : undefined,
          notes: data.notes || undefined,
        });
      } else if (dialogMode === "edit" && editingClient) {
        updateMutation.mutate({
          clientId: editingClient.id,
          name: data.name.trim(),
          phone: data.phone || undefined,
          email: data.email || undefined,
          whatsapp: data.whatsapp || undefined,
          city: data.city || undefined,
          preferredLanguage: lang || undefined,
          tags: tags.length > 0 ? tags : undefined,
          notes: data.notes || undefined,
        });
      }
    },
    [dialogMode, editingClient, createMutation, updateMutation],
  );

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await exportQuery.refetch();
      const data = result.data;
      if (!data) return;

      const csvContent = [
        data.headers.join(","),
        ...data.rows.map((row: string[]) =>
          row.map((cell: string) => `"${cell.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clients-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `${data.count} clients exported to CSV.`,
      });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not export clients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportQuery, toast]);

  // ------ Render ------
  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* Header                                                       */}
      {/* ============================================================ */}
      <DashboardPageHeader
        title="Clients"
        description="Manage your client relationships, track event history, and communicate effectively."
        icon={<Users className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void handleExportCSV()}
              disabled={isExporting || totalClients === 0}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export CSV
            </Button>
            <Button className="gap-2" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </div>
        }
      />

      {/* ============================================================ */}
      {/* Segment Cards                                                */}
      {/* ============================================================ */}
      {segments && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <SegmentCard
            label="Total"
            value={segments.total}
            icon={Users}
            colorClass="text-foreground"
          />
          <SegmentCard
            label="VIP"
            value={segments.vip}
            icon={Star}
            colorClass="text-gold"
          />
          <SegmentCard
            label="Corporate"
            value={segments.corporate}
            icon={Building2}
            colorClass="text-[hsl(var(--majorelle-blue))]"
          />
          <SegmentCard
            label="Repeat"
            value={segments.repeat}
            icon={RefreshCcw}
            colorClass="text-sage"
          />
          <SegmentCard
            label="New"
            value={segments.newClients}
            icon={Sparkles}
            colorClass="text-primary"
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* Filter Bar                                                   */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortBy)}
          >
            <SelectTrigger className="w-full sm:w-[160px] gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tag Filter Pills */}
        <TagFilterPills
          allTags={(allTags as string[]) ?? []}
          activeTags={activeTags}
          onToggle={handleToggleTag}
        />

        {/* Active filter summary */}
        {(search || activeTags.length > 0) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Showing {clients.length} result{clients.length !== 1 ? "s" : ""}
            </span>
            {(search || activeTags.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setSearch("");
                  setActiveTags([]);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Client List                                                  */}
      {/* ============================================================ */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading Skeleton
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="flex gap-1">
                          <div className="h-5 w-12 bg-muted rounded-full" />
                          <div className="h-5 w-16 bg-muted rounded-full" />
                        </div>
                      </div>
                      <div className="h-8 w-8 bg-muted rounded" />
                    </div>
                    <div className="border-t pt-3 grid grid-cols-2 gap-2">
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-3 w-28 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : clients.length === 0 && !search && activeTags.length === 0 ? (
          // Empty state (no clients at all)
          <EmptyState onAdd={handleOpenAdd} />
        ) : clients.length === 0 ? (
          // No results for current filters
          <NoResults
            search={search}
            onClear={() => {
              setSearch("");
              setActiveTags([]);
            }}
          />
        ) : (
          // Client cards
          <div className="grid gap-3">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => handleOpenDetail(client)}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="gap-2"
            >
              {isFetchingNextPage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Load more clients
            </Button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Dialogs                                                      */}
      {/* ============================================================ */}

      {/* Add Client Dialog */}
      {dialogMode === "add" && (
        <ClientFormDialog
          mode="add"
          initialData={INITIAL_FORM}
          onClose={handleCloseDialog}
          onSave={handleSaveClient}
          isSaving={createMutation.isLoading}
        />
      )}

      {/* Edit Client Dialog */}
      {dialogMode === "edit" && editingClient && (
        <ClientFormDialog
          mode="edit"
          initialData={clientToForm(editingClient)}
          onClose={handleCloseDialog}
          onSave={handleSaveClient}
          isSaving={updateMutation.isLoading}
        />
      )}

      {/* Client Detail Dialog */}
      {dialogMode === "detail" && selectedClientId && (
        <ClientDetailDialog
          clientId={selectedClientId}
          onClose={handleCloseDialog}
          onEdit={handleOpenEdit}
        />
      )}
    </div>
  );
}
