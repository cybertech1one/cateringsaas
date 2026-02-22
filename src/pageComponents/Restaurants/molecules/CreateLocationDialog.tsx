"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";

const createLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Location name is required")
    .max(100, "Name must be 100 characters or less"),
  address: z
    .string()
    .max(200, "Address must be 200 characters or less")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100, "City must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .max(100, "State must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .max(100, "Country must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  postalCode: z
    .string()
    .max(20, "Postal code must be 20 characters or less")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(30, "Phone must be 30 characters or less")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  timezone: z
    .string()
    .max(50, "Timezone must be 50 characters or less")
    .optional()
    .or(z.literal("")),
});

type CreateLocationForm = z.infer<typeof createLocationSchema>;

interface CreateLocationDialogProps {
  restaurantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLocationDialog({
  restaurantId,
  open,
  onOpenChange,
}: CreateLocationDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const utils = api.useContext();

  const form = useForm<CreateLocationForm>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
      email: "",
      timezone: "",
    },
  });

  const createMutation = api.restaurants.createLocation.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.locationAdded"),
        description: t("toast.locationAddedDescription"),
      });
      form.reset();
      onOpenChange(false);
      void utils.restaurants.getRestaurant.invalidate({ id: restaurantId });
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateLocationForm) => {
    createMutation.mutate({
      restaurantId,
      name: values.name,
      address: values.address || "",
      city: values.city || "",
      state: values.state || undefined,
      country: values.country || "",
      postalCode: values.postalCode || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      timezone: values.timezone || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("locations.addLocation")}</DialogTitle>
          <DialogDescription>
            {t("locations.addLocationDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("locations.nameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("locations.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("locations.address")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("locations.addressPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("locations.city")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("locations.cityPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("locations.stateProvince")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("locations.statePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("locations.country")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("locations.countryPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("locations.postalCode")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("locations.postalCodePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("locations.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t("locations.phonePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("locations.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("locations.emailPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("locations.timezone")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("locations.timezonePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("restaurants.cancel")}
              </Button>
              <Button
                type="submit"
                loading={createMutation.isLoading}
                disabled={!form.formState.isValid}
              >
                {t("locations.addLocation")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
