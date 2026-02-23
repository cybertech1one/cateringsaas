"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  UtensilsCrossed,
  CalendarDays,
  Save,
  AlertTriangle,
  Instagram,
  Facebook,
  MessageCircle,
  Shield,
  Settings,
  Trash2,
  X,
  Plus,
  Check,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORG_TYPES = [
  { value: "caterer", label: "Caterer" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "venue", label: "Venue" },
  { value: "event_planner", label: "Event Planner" },
] as const;

const PRICE_RANGES = [
  { value: "budget", label: "Budget" },
  { value: "mid", label: "Mid-Range" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
] as const;

const MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fes",
  "Tangier",
  "Agadir",
  "Meknes",
  "Oujda",
  "Kenitra",
  "Tetouan",
  "Safi",
  "El Jadida",
  "Nador",
  "Beni Mellal",
  "Khouribga",
  "Mohammedia",
  "Taza",
  "Settat",
] as const;

const CUISINE_OPTIONS = [
  "Moroccan Traditional",
  "Moroccan Modern",
  "Mediterranean",
  "Middle Eastern",
  "French",
  "Italian",
  "Asian Fusion",
  "Seafood",
  "Vegetarian",
  "Pastry & Desserts",
  "International",
  "Halal BBQ",
] as const;

const EVENT_TYPE_OPTIONS = [
  { value: "wedding", label: "Weddings" },
  { value: "corporate", label: "Corporate Events" },
  { value: "ramadan_iftar", label: "Ramadan Iftar" },
  { value: "eid", label: "Eid Celebrations" },
  { value: "birthday", label: "Birthdays" },
  { value: "conference", label: "Conferences" },
  { value: "funeral", label: "Funerals" },
  { value: "engagement", label: "Engagements" },
  { value: "henna", label: "Henna Ceremonies" },
  { value: "graduation", label: "Graduations" },
  { value: "diffa", label: "Diffa" },
] as const;

const SERVICE_AREA_OPTIONS = [
  "Casablanca-Settat",
  "Rabat-Sale-Kenitra",
  "Marrakech-Safi",
  "Fes-Meknes",
  "Tanger-Tetouan-Al Hoceima",
  "Souss-Massa",
  "Oriental",
  "Beni Mellal-Khenifra",
  "Draa-Tafilalet",
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrgType = "caterer" | "restaurant" | "hotel" | "venue" | "event_planner";
type PriceRange = "budget" | "mid" | "premium" | "luxury";

interface OrgFormData {
  name: string;
  description: string;
  bio: string;
  type: OrgType;
  city: string;
  address: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  website: string;
  instagram: string;
  facebook: string;
  cuisines: string[];
  specialties: string[];
  eventTypes: string[];
  serviceAreas: string[];
  minGuests: number;
  maxGuests: number;
  priceRange: PriceRange;
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function MultiSelectPills({
  options,
  selected,
  onChange,
  label,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
}) {
  const toggle = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange]
  );

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                isSelected
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
  label,
}: {
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
}) {
  const toggle = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange]
  );

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-colors text-left",
                isSelected
                  ? "bg-primary/10 border-primary/30 text-foreground"
                  : "bg-card border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function OrgSettings() {
  const { toast } = useToast();
  const apiContext = api.useContext();

  // ── Queries ────────────────────────────────────────────────────────────
  const orgQuery = api.organizations.getMine.useQuery();
  const org = orgQuery.data;

  // ── Form State ─────────────────────────────────────────────────────────
  const [form, setForm] = useState<OrgFormData>({
    name: "",
    description: "",
    bio: "",
    type: "caterer",
    city: "",
    address: "",
    phone: "",
    email: "",
    whatsappNumber: "",
    website: "",
    instagram: "",
    facebook: "",
    cuisines: [],
    specialties: [],
    eventTypes: [],
    serviceAreas: [],
    minGuests: 10,
    maxGuests: 500,
    priceRange: "mid",
  });

  const [isDirty, setIsDirty] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");

  // ── Populate form from query data ──────────────────────────────────────
  useEffect(() => {
    if (org) {
      setForm({
        name: org.name ?? "",
        description: org.description ?? "",
        bio: org.bio ?? "",
        type: (org.type as OrgType) ?? "caterer",
        city: org.city ?? "",
        address: org.address ?? "",
        phone: org.phone ?? "",
        email: org.email ?? "",
        whatsappNumber: org.whatsappNumber ?? "",
        website: org.website ?? "",
        instagram: org.instagram ?? "",
        facebook: org.facebook ?? "",
        cuisines: (org.cuisines as string[]) ?? [],
        specialties: (org.specialties as string[]) ?? [],
        eventTypes: (org.eventTypes as string[]) ?? [],
        serviceAreas: (org.serviceAreas as string[]) ?? [],
        minGuests: org.minGuests ?? 10,
        maxGuests: org.maxGuests ?? 500,
        priceRange: (org.priceRange as PriceRange) ?? "mid",
      });
      setIsDirty(false);
    }
  }, [org]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const updateMutation = api.organizations.update.useMutation({
    onSuccess: () => {
      toast({ title: "Settings saved", description: "Organization settings updated successfully." });
      setIsDirty(false);
      void apiContext.organizations.getMine.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof OrgFormData>(key: K, value: OrgFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleSave = useCallback(() => {
    updateMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      bio: form.bio || undefined,
      city: form.city || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      whatsappNumber: form.whatsappNumber || undefined,
      website: form.website || undefined,
      instagram: form.instagram || undefined,
      facebook: form.facebook || undefined,
      cuisines: form.cuisines,
      specialties: form.specialties,
      minGuests: form.minGuests,
      maxGuests: form.maxGuests,
      priceRange: form.priceRange,
    });
  }, [form, updateMutation]);

  const addSpecialty = useCallback(() => {
    const trimmed = newSpecialty.trim();
    if (trimmed && !form.specialties.includes(trimmed)) {
      updateField("specialties", [...form.specialties, trimmed]);
      setNewSpecialty("");
    }
  }, [newSpecialty, form.specialties, updateField]);

  const removeSpecialty = useCallback(
    (specialty: string) => {
      updateField(
        "specialties",
        form.specialties.filter((s) => s !== specialty)
      );
    },
    [form.specialties, updateField]
  );

  // ── Loading state ──────────────────────────────────────────────────────
  if (orgQuery.isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <DashboardPageHeader
          title="Settings"
          description="Organization settings"
          icon={<Settings className="h-5 w-5" />}
        />
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg">No Organization Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create an organization first to access settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <DashboardPageHeader
        title="Settings"
        description="Manage your organization profile and business settings"
        icon={<Settings className="h-5 w-5" />}
        actions={
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {updateMutation.isLoading ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      {/* Dirty indicator */}
      {isDirty && (
        <div className="flex items-center gap-2 rounded-lg bg-gold/10 border border-gold/20 px-4 py-2 text-sm text-gold">
          <AlertTriangle className="h-4 w-4" />
          You have unsaved changes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Organization Profile ─────────────────────────────────────── */}
        <Card>
          <CardContent className="p-5 space-y-5">
            <SectionHeading
              icon={<Building2 className="h-4 w-4" />}
              title="Organization Profile"
              description="Basic information about your business"
            />

            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your Catering Business"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Slug:</Label>
                <Badge variant="secondary" className="font-mono text-xs">
                  {org.slug}
                </Badge>
              </div>

              <div>
                <Label htmlFor="org-type">Organization Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => updateField("type", v as OrgType)}
                >
                  <SelectTrigger id="org-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="org-description">Description</Label>
                <Textarea
                  id="org-description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description of your catering services..."
                  rows={3}
                  className="mt-1 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.description.length}/2000 characters
                </p>
              </div>

              <div>
                <Label htmlFor="org-bio">Bio / About</Label>
                <Textarea
                  id="org-bio"
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  placeholder="Tell your story... How did your catering journey begin?"
                  rows={4}
                  className="mt-1 resize-none"
                />
              </div>

              {/* Logo placeholder */}
              <div>
                <Label>Logo</Label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt="Logo"
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Upload Logo (Coming Soon)
                  </Button>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label htmlFor="org-price-range">Price Range</Label>
                <Select
                  value={form.priceRange}
                  onValueChange={(v) =>
                    updateField("priceRange", v as PriceRange)
                  }
                >
                  <SelectTrigger id="org-price-range" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((pr) => (
                      <SelectItem key={pr.value} value={pr.value}>
                        {pr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Contact Information ──────────────────────────────────────── */}
        <Card>
          <CardContent className="p-5 space-y-5">
            <SectionHeading
              icon={<Phone className="h-4 w-4" />}
              title="Contact Information"
              description="How clients can reach you"
            />

            <div className="space-y-4">
              <div>
                <Label htmlFor="org-phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="org-phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="org-email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="org-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="contact@yourbusiness.ma"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="org-whatsapp">WhatsApp</Label>
                <div className="relative mt-1">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="org-whatsapp"
                    value={form.whatsappNumber}
                    onChange={(e) =>
                      updateField("whatsappNumber", e.target.value)
                    }
                    placeholder="+212 6XX XXX XXX"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="org-website">Website</Label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="org-website"
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://yourbusiness.ma"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="org-instagram">Instagram</Label>
                  <div className="relative mt-1">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="org-instagram"
                      value={form.instagram}
                      onChange={(e) =>
                        updateField("instagram", e.target.value)
                      }
                      placeholder="@handle"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="org-facebook">Facebook</Label>
                  <div className="relative mt-1">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="org-facebook"
                      value={form.facebook}
                      onChange={(e) =>
                        updateField("facebook", e.target.value)
                      }
                      placeholder="Page name"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="pt-3 border-t space-y-4">
                <SectionHeading
                  icon={<MapPin className="h-4 w-4" />}
                  title="Location"
                />

                <div>
                  <Label htmlFor="org-city">City</Label>
                  <Select
                    value={form.city}
                    onValueChange={(v) => updateField("city", v)}
                  >
                    <SelectTrigger id="org-city" className="mt-1">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOROCCAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="org-address">Address</Label>
                  <Textarea
                    id="org-address"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Full address..."
                    rows={2}
                    className="mt-1 resize-none"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Business Settings ────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-5 space-y-5">
            <SectionHeading
              icon={<Users className="h-4 w-4" />}
              title="Capacity & Pricing"
              description="Guest limits and service fees"
            />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="org-min-guests">Minimum Guests</Label>
                  <Input
                    id="org-min-guests"
                    type="number"
                    min={1}
                    value={form.minGuests}
                    onChange={(e) =>
                      updateField("minGuests", parseInt(e.target.value) || 1)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="org-max-guests">Maximum Guests</Label>
                  <Input
                    id="org-max-guests"
                    type="number"
                    min={1}
                    value={form.maxGuests}
                    onChange={(e) =>
                      updateField("maxGuests", parseInt(e.target.value) || 1)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p>
                  Service fees and TVA rates are configured per-quote in the
                  Quotes module. These settings define your general capacity
                  range visible to potential clients.
                </p>
              </div>
            </div>

            {/* Specialties */}
            <div className="pt-3 border-t">
              <Label className="text-sm font-medium">Specialties</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Highlight your signature dishes or services
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.specialties.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(specialty)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="Add specialty..."
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpecialty}
                  disabled={!newSpecialty.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Service Configuration ────────────────────────────────────── */}
        <Card>
          <CardContent className="p-5 space-y-5">
            <SectionHeading
              icon={<UtensilsCrossed className="h-4 w-4" />}
              title="Cuisine Types"
              description="Select the cuisines you offer"
            />

            <MultiSelectPills
              label="Cuisines"
              options={CUISINE_OPTIONS}
              selected={form.cuisines}
              onChange={(v) => updateField("cuisines", v)}
            />
          </CardContent>
        </Card>

        {/* ── Event Types ──────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-5 space-y-5">
            <SectionHeading
              icon={<CalendarDays className="h-4 w-4" />}
              title="Event Types Supported"
              description="Which types of events do you cater?"
            />

            <CheckboxGroup
              label="Event Types"
              options={EVENT_TYPE_OPTIONS}
              selected={form.eventTypes}
              onChange={(v) => updateField("eventTypes", v)}
            />
          </CardContent>
        </Card>

        {/* ── Service Areas ────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-5 space-y-5">
            <SectionHeading
              icon={<MapPin className="h-4 w-4" />}
              title="Operating Regions"
              description="Cities and regions you serve"
            />

            <MultiSelectPills
              label="Service Areas"
              options={SERVICE_AREA_OPTIONS}
              selected={form.serviceAreas}
              onChange={(v) => updateField("serviceAreas", v)}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <Card className="border-destructive/30">
        <CardContent className="p-5">
          <SectionHeading
            icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            title="Danger Zone"
            description="Irreversible actions for your organization"
          />

          <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4 bg-destructive/5">
            <div>
              <p className="text-sm font-medium">Deactivate Organization</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your organization will be hidden from the marketplace and all
                active events will be affected.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeactivateDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Deactivate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (mobile sticky) */}
      <div className="sticky bottom-4 flex justify-end lg:hidden">
        <Button
          onClick={handleSave}
          disabled={!isDirty || updateMutation.isLoading}
          className="bg-primary hover:bg-primary/90 shadow-lg"
          size="lg"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {updateMutation.isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Deactivate Organization
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-medium text-foreground">{org.name}</span>?
              This will hide your profile from the marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                Your profile will be hidden from search and browse
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                Pending inquiries will not receive new ones
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                Existing events will remain accessible
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast({
                  title: "Contact Support",
                  description:
                    "Please contact support to deactivate your organization.",
                });
                setDeactivateDialogOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
