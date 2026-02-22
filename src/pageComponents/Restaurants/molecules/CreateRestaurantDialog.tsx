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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { CUISINE_TYPES } from "../constants";

const createRestaurantSchema = z.object({
  name: z
    .string()
    .min(1, "Restaurant name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  cuisineType: z.string().optional().or(z.literal("")),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

type CreateRestaurantForm = z.infer<typeof createRestaurantSchema>;

interface CreateRestaurantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRestaurantDialog({
  open,
  onOpenChange,
}: CreateRestaurantDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const utils = api.useContext();

  const form = useForm<CreateRestaurantForm>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      cuisineType: "",
      website: "",
    },
  });

  const createMutation = api.restaurants.createRestaurant.useMutation({
    onSuccess: () => {
      toast({
        title: t("toast.restaurantCreated"),
        description: t("toast.restaurantCreatedDescription"),
      });
      form.reset();
      onOpenChange(false);
      void utils.restaurants.getRestaurants.invalidate();
    },
    onError: (err) => {
      toast({
        title: t("toast.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateRestaurantForm) => {
    createMutation.mutate({
      name: values.name,
      description: values.description || undefined,
      cuisineType: values.cuisineType || undefined,
      website: values.website || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("restaurants.createRestaurant")}</DialogTitle>
          <DialogDescription>
            {t("restaurants.dialogCreateDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("restaurants.nameRequired")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("restaurants.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("restaurants.descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("restaurants.descriptionPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cuisineType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("restaurants.cuisineType")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("restaurants.cuisineTypePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CUISINE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("restaurants.websiteLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t("restaurants.websitePlaceholder")}
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
                {t("restaurants.createRestaurant")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
