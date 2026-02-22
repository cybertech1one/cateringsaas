"use client";

import { type Control, type FieldErrors, type UseFormRegister, Controller } from "react-hook-form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useTranslation } from "react-i18next";
import {
  type Menu,
  type PromotionFormValues,
  DAYS_OF_WEEK,
  PROMOTION_TYPES,
} from "../types";

// ── Types ────────────────────────────────────────────────────

interface PromotionFormFieldsProps {
  register: UseFormRegister<PromotionFormValues>;
  control: Control<PromotionFormValues>;
  errors: FieldErrors<PromotionFormValues>;
  menus: Menu[];
}

// ── Component ────────────────────────────────────────────────

export function PromotionFormFields({
  register,
  control,
  errors,
  menus,
}: PromotionFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t("promotions.titleLabel")}</Label>
        <Input
          id="title"
          placeholder={t("promotions.titlePlaceholder")}
          maxLength={200}
          required
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t("promotions.descriptionLabel")}</Label>
        <Textarea
          id="description"
          placeholder={t("promotions.descriptionPlaceholder")}
          rows={3}
          maxLength={1000}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Promotion Type */}
      <div className="space-y-2">
        <Label>{t("promotions.promotionType")}</Label>
        <Controller
          control={control}
          name="promotionType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("promotions.promotionTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {PROMOTION_TYPES.map((type) => {
                  const typeLabels: Record<string, string> = {
                    daily_special: t("promotions.dailySpecial"),
                    happy_hour: t("promotions.happyHour"),
                    discount: t("promotions.discount"),
                    combo: t("promotions.combo"),
                    seasonal: t("promotions.seasonal"),
                  };

                  return (
                    <SelectItem key={type.value} value={type.value}>
                      {typeLabels[type.value] ?? type.value}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Discount Percent / Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discountPercent">{t("promotions.discountPercent")}</Label>
          <Input
            id="discountPercent"
            type="number"
            min={0}
            max={100}
            placeholder={t("promotions.discountPercentPlaceholder")}
            {...register("discountPercent")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountAmount">
            {t("promotions.fixedAmountCents")}
          </Label>
          <Input
            id="discountAmount"
            type="number"
            min={0}
            placeholder={t("promotions.discountAmountPlaceholder")}
            {...register("discountAmount")}
          />
        </div>
      </div>
      {errors.discountPercent && (
        <p className="text-xs text-destructive">
          {errors.discountPercent.message}
        </p>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t("promotions.startDateRequired")}</Label>
          <Input id="startDate" type="date" required {...register("startDate")} />
          {errors.startDate && (
            <p className="text-xs text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t("promotions.endDate")}</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && (
            <p className="text-xs text-destructive">
              {errors.endDate.message}
            </p>
          )}
        </div>
      </div>

      {/* Time Window */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">{t("promotions.startTime")}</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">{t("promotions.endTime")}</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
        </div>
      </div>

      {/* Applicable Days */}
      <div className="space-y-2">
        <Label>{t("promotions.applicableDays")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("promotions.applicableDaysHint")}
        </p>
        <Controller
          control={control}
          name="applicableDays"
          render={({ field }) => (
            <div className="flex flex-wrap gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const isChecked = field.value.includes(day.value);

                return (
                  <label
                    key={day.value}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...field.value, day.value]);
                        } else {
                          field.onChange(
                            field.value.filter((d) => d !== day.value),
                          );
                        }
                      }}
                    />
                    <span className="text-sm">{(() => {
                      const dayLabels: Record<string, string> = {
                        monday: t("promotions.dayMon"),
                        tuesday: t("promotions.dayTue"),
                        wednesday: t("promotions.dayWed"),
                        thursday: t("promotions.dayThu"),
                        friday: t("promotions.dayFri"),
                        saturday: t("promotions.daySat"),
                        sunday: t("promotions.daySun"),
                      };

                      return dayLabels[day.value] ?? day.value;
                    })()}</span>
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Menu selector (optional) */}
      {menus.length > 0 && (
        <div className="space-y-2">
          <Label>{t("promotions.linkToMenu")}</Label>
          <Controller
            control={control}
            name="menuId"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) =>
                  field.onChange(v === "none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("promotions.noSpecificMenu")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("promotions.noSpecificMenu")}</SelectItem>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label>{t("promotions.active")}</Label>
      </div>
    </>
  );
}
