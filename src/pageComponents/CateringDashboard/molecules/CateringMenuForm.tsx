"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CateringMenu = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  eventType: string;
  isPublished: boolean;
  minGuests: number | null;
  maxGuests: number | null;
  basePricePerPerson: number | null;
  leadTimeDays: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  serviceDelivery: boolean;
  serviceSetup: boolean;
  serviceStaff: boolean;
  serviceEquipment: boolean;
  serviceCleanup: boolean;
} | null;

interface CateringMenuFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: CateringMenu;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Event type options
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  "wedding",
  "corporate",
  "birthday",
  "conference",
  "graduation",
  "holiday",
  "funeral",
  "religious",
  "social",
  "other",
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CateringMenuForm({
  open,
  onOpenChange,
  menu,
  onSuccess,
}: CateringMenuFormProps) {
  const { toast } = useToast();
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const isEditing = !!menu;

  // ── Form state ─────────────────────────────────────────────

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [eventType, setEventType] = useState<string>("wedding");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [basePricePerPerson, setBasePricePerPerson] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [serviceDelivery, setServiceDelivery] = useState(false);
  const [serviceSetup, setServiceSetup] = useState(false);
  const [serviceStaff, setServiceStaff] = useState(false);
  const [serviceEquipment, setServiceEquipment] = useState(false);
  const [serviceCleanup, setServiceCleanup] = useState(false);

  // ── Reset form on open ─────────────────────────────────────

  useEffect(() => {
    if (open && menu) {
      setName(menu.name);
      setDescription(menu.description ?? "");
      setCity(menu.city ?? "");
      setEventType(menu.eventType);
      setContactPhone(menu.contactPhone ?? "");
      setContactEmail(menu.contactEmail ?? "");
      setMinGuests(menu.minGuests?.toString() ?? "");
      setMaxGuests(menu.maxGuests?.toString() ?? "");
      setBasePricePerPerson(
        menu.basePricePerPerson != null
          ? (menu.basePricePerPerson / 100).toFixed(2)
          : "",
      );
      setLeadTimeDays(menu.leadTimeDays?.toString() ?? "");
      setServiceDelivery(menu.serviceDelivery ?? false);
      setServiceSetup(menu.serviceSetup ?? false);
      setServiceStaff(menu.serviceStaff ?? false);
      setServiceEquipment(menu.serviceEquipment ?? false);
      setServiceCleanup(menu.serviceCleanup ?? false);
    } else if (open && !menu) {
      setName("");
      setDescription("");
      setCity("");
      setEventType("wedding");
      setContactPhone("");
      setContactEmail("");
      setMinGuests("");
      setMaxGuests("");
      setBasePricePerPerson("");
      setLeadTimeDays("");
      setServiceDelivery(false);
      setServiceSetup(false);
      setServiceStaff(false);
      setServiceEquipment(false);
      setServiceCleanup(false);
    }
  }, [open, menu]);

  // ── Mutations ──────────────────────────────────────────────

  const createMutation = api.cateringMenus.create.useMutation({
    onSuccess: () => {
      toast({
        title: t("catering.menuCreated"),
        description: t("catering.menuCreatedDescription"),
      });
      onSuccess();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.cateringMenus.update.useMutation({
    onSuccess: () => {
      toast({
        title: t("catering.menuUpdated"),
        description: t("catering.menuUpdatedDescription"),
      });
      onSuccess();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  // ── Submit ─────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: t("toast.error"),
        description: t("catering.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    // cateringMenus.create expects: { name, type, description?, minGuests?,
    // maxGuests?, basePricePerHead?, tier?, cuisineType?, ... }
    // cateringMenus.update expects: { menuId, name?, description?, ... }
    // TODO: city, eventType, contactPhone, contactEmail, leadTimeDays, and
    // serviceOptions are not accepted by cateringMenus create/update. These
    // fields need to be added to the router schema.
    if (isEditing && menu) {
      updateMutation.mutate({
        menuId: menu.id,
        name: name.trim(),
        description: description.trim() || undefined,
        eventType: eventType || undefined,
        minGuests: minGuests ? parseInt(minGuests, 10) : undefined,
        maxGuests: maxGuests ? parseInt(maxGuests, 10) : undefined,
        basePricePerPerson: basePricePerPerson
          ? Math.round(parseFloat(basePricePerPerson) * 100)
          : undefined,
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        menuType: "per_head" as const,
        description: description.trim() || undefined,
        eventType: eventType || "general",
        minGuests: minGuests ? parseInt(minGuests, 10) : 10,
        maxGuests: maxGuests ? parseInt(maxGuests, 10) : 500,
        basePricePerPerson: basePricePerPerson
          ? Math.round(parseFloat(basePricePerPerson) * 100)
          : 0,
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("catering.editMenuTitle")
              : t("catering.createMenuTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("catering.editMenuDescription")
              : t("catering.createMenuDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="catering-name">{t("catering.form.name")}</Label>
            <Input
              id="catering-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("catering.form.namePlaceholder")}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="catering-description">
              {t("catering.form.description")}
            </Label>
            <Textarea
              id="catering-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("catering.form.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          {/* City & Event Type (side by side) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="catering-city">{t("catering.form.city")}</Label>
              <Input
                id="catering-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("catering.form.cityPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("catering.form.eventType")}</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue
                    placeholder={t("catering.form.eventTypePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`catering.eventTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="catering-phone">
                {t("catering.form.contactPhone")}
              </Label>
              <Input
                id="catering-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder={t("catering.form.contactPhonePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catering-email">
                {t("catering.form.contactEmail")}
              </Label>
              <Input
                id="catering-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={t("catering.form.contactEmailPlaceholder")}
              />
            </div>
          </div>

          {/* Guest range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="catering-min-guests">
                {t("catering.form.minGuests")}
              </Label>
              <Input
                id="catering-min-guests"
                type="number"
                min={1}
                value={minGuests}
                onChange={(e) => setMinGuests(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catering-max-guests">
                {t("catering.form.maxGuests")}
              </Label>
              <Input
                id="catering-max-guests"
                type="number"
                min={1}
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                placeholder="500"
              />
            </div>
          </div>

          {/* Price & Lead time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="catering-price">
                {t("catering.form.basePricePerPerson")}
              </Label>
              <Input
                id="catering-price"
                type="number"
                step="0.01"
                min={0}
                value={basePricePerPerson}
                onChange={(e) => setBasePricePerPerson(e.target.value)}
                placeholder="150.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catering-lead-time">
                {t("catering.form.leadTimeDays")}
              </Label>
              <Input
                id="catering-lead-time"
                type="number"
                min={0}
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                placeholder="7"
              />
            </div>
          </div>

          {/* Service options */}
          <div className="space-y-3">
            <Label>{t("catering.form.serviceOptions")}</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={serviceDelivery}
                  onCheckedChange={(checked) =>
                    setServiceDelivery(checked === true)
                  }
                />
                <span className="text-sm">
                  {t("catering.form.serviceDelivery")}
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={serviceSetup}
                  onCheckedChange={(checked) =>
                    setServiceSetup(checked === true)
                  }
                />
                <span className="text-sm">
                  {t("catering.form.serviceSetup")}
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={serviceStaff}
                  onCheckedChange={(checked) =>
                    setServiceStaff(checked === true)
                  }
                />
                <span className="text-sm">
                  {t("catering.form.serviceStaff")}
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={serviceEquipment}
                  onCheckedChange={(checked) =>
                    setServiceEquipment(checked === true)
                  }
                />
                <span className="text-sm">
                  {t("catering.form.serviceEquipment")}
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={serviceCleanup}
                  onCheckedChange={(checked) =>
                    setServiceCleanup(checked === true)
                  }
                />
                <span className="text-sm">
                  {t("catering.form.serviceCleanup")}
                </span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("catering.form.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? t("catering.form.saving")
                : isEditing
                  ? t("catering.form.update")
                  : t("catering.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
