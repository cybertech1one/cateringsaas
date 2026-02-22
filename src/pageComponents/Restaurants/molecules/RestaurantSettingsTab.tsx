"use client";

import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CUISINE_TYPES } from "../constants";

interface RestaurantSettingsTabProps {
  editName: string;
  editDescription: string;
  editCuisineType: string;
  editWebsite: string;
  isSubmitting: boolean;
  onEditNameChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onEditCuisineTypeChange: (value: string) => void;
  onEditWebsiteChange: (value: string) => void;
  onSubmit: () => void;
}

export function RestaurantSettingsTab({
  editName,
  editDescription,
  editCuisineType,
  editWebsite,
  isSubmitting,
  onEditNameChange,
  onEditDescriptionChange,
  onEditCuisineTypeChange,
  onEditWebsiteChange,
  onSubmit,
}: RestaurantSettingsTabProps) {
  const { t: rawT } = useTranslation("common");
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("restaurants.detailsTitle")}</CardTitle>
        <CardDescription>
          {t("restaurants.detailsDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">{t("restaurants.nameLabel")}</Label>
            <Input
              id="name"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              placeholder={t("restaurants.namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("restaurants.descriptionLabel")}</Label>
            <Input
              id="description"
              value={editDescription}
              onChange={(e) => onEditDescriptionChange(e.target.value)}
              placeholder={t("restaurants.descriptionPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisineType">{t("restaurants.cuisineType")}</Label>
            <Select
              value={editCuisineType}
              onValueChange={onEditCuisineTypeChange}
            >
              <SelectTrigger id="cuisineType">
                <SelectValue placeholder={t("restaurants.cuisineTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {CUISINE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">{t("restaurants.websiteLabel")}</Label>
            <Input
              id="website"
              type="url"
              value={editWebsite}
              onChange={(e) => onEditWebsiteChange(e.target.value)}
              placeholder={t("restaurants.websitePlaceholder")}
            />
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!editName.trim()}
          >
            {t("restaurants.saveChanges")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
