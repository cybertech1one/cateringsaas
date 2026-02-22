"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { DashboardShell } from "~/pageComponents/Dashboard/molecules/Shell";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { RestaurantHeader } from "./molecules/RestaurantHeader";
import { RestaurantLocationsTab } from "./molecules/RestaurantLocationsTab";
import { RestaurantMenusTab } from "./molecules/RestaurantMenusTab";
import { RestaurantPromotionsTab } from "./molecules/RestaurantPromotionsTab";
import { RestaurantSettingsTab } from "./molecules/RestaurantSettingsTab";
import {
  ArrowLeft,
  MapPin,
  Store,
  Tag,
  Settings,
  MenuSquare,
} from "lucide-react";
import Link from "next/link";

export function RestaurantDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const restaurantId = params.restaurantId as string;

  const [createLocationOpen, setCreateLocationOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCuisineType, setEditCuisineType] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [settingsInitialized, setSettingsInitialized] = useState(false);

  const {
    data: restaurant,
    isLoading,
    error,
  } = api.restaurants.getRestaurant.useQuery(
    { id: restaurantId },
    {
      onSuccess: (data) => {
        if (!settingsInitialized && data) {
          setEditName(data.name);
          setEditDescription(data.description ?? "");
          setEditCuisineType(data.cuisineType ?? "");
          setEditWebsite(data.website ?? "");
          setSettingsInitialized(true);
        }
      },
    },
  );

  const updateMutation = api.restaurants.updateRestaurant.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.restaurantUpdated"),
        description: t("toast.restaurantUpdatedDescription"),
      });
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = api.restaurants.deleteLocation.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.locationDeleted"),
        description: t("toast.locationDeletedDescription"),
      });
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteLocation = useCallback(
    (locationId: string) => {
      deleteLocationMutation.mutate({ id: locationId });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteLocationMutation.mutate],
  );

  if (isLoading) return <LoadingScreen />;

  if (error || !restaurant) {
    return (
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <DashboardShell>
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <Store className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold">{t("restaurants.notFound")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("restaurants.notFoundDescription")}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/restaurants">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("restaurants.backToRestaurants")}
              </Link>
            </Button>
          </div>
        </DashboardShell>
      </main>
    );
  }

  const menus = (restaurant as unknown as { menus?: Array<{ id: string; name: string; slug: string; isPublished: boolean }> }).menus ?? [];
  const promotions = (restaurant as unknown as { promotions?: Array<{ id: string; title: string; description: string | null; startDate: Date | string; endDate: Date | string | null; isActive: boolean }> }).promotions ?? [];

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      <DashboardShell>
        {/* Back navigation */}
        <Link
          href="/dashboard/restaurants"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("restaurants.backToRestaurants")}
        </Link>

        {/* Restaurant header */}
        <RestaurantHeader
          name={restaurant.name}
          cuisineType={restaurant.cuisineType}
          website={restaurant.website}
          description={restaurant.description}
        />

        {/* Tabs */}
        <Tabs defaultValue="locations" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="locations" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              {t("restaurants.locations")}
            </TabsTrigger>
            <TabsTrigger value="menus" className="gap-1.5">
              <MenuSquare className="h-4 w-4" />
              {t("restaurants.menus")}
            </TabsTrigger>
            <TabsTrigger value="promotions" className="gap-1.5">
              <Tag className="h-4 w-4" />
              {t("restaurants.promotions")}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              {t("restaurants.settings")}
            </TabsTrigger>
          </TabsList>

          {/* Locations Tab */}
          <TabsContent value="locations" className="mt-6">
            <RestaurantLocationsTab
              locations={restaurant.locations ?? []}
              restaurantId={restaurantId}
              createLocationOpen={createLocationOpen}
              onCreateLocationOpenChange={setCreateLocationOpen}
              onDeleteLocation={handleDeleteLocation}
            />
          </TabsContent>

          {/* Menus Tab */}
          <TabsContent value="menus" className="mt-6">
            <RestaurantMenusTab menus={menus} />
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="mt-6">
            <RestaurantPromotionsTab promotions={promotions} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <RestaurantSettingsTab
              editName={editName}
              editDescription={editDescription}
              editCuisineType={editCuisineType}
              editWebsite={editWebsite}
              isSubmitting={updateMutation.isLoading}
              onEditNameChange={setEditName}
              onEditDescriptionChange={setEditDescription}
              onEditCuisineTypeChange={setEditCuisineType}
              onEditWebsiteChange={setEditWebsite}
              onSubmit={() =>
                updateMutation.mutate({
                  id: restaurantId,
                  name: editName,
                  description: editDescription || undefined,
                  cuisineType: editCuisineType || undefined,
                  website: editWebsite || undefined,
                })
              }
            />
          </TabsContent>
        </Tabs>
      </DashboardShell>
    </main>
  );
}
