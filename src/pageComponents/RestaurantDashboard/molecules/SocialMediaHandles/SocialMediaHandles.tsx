import { useForm } from "react-hook-form";
import { Icons } from "~/components/Icons";
import { Button } from "~/components/ui/button";
import { Form, FormField } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { GoogleReviewGuideButton } from "../GoogleReviewGuideButton/GoogleReviewGuideButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import {
  type SocialMediaFormValues,
  socialMediaValidationSchema,
} from "./SocialMediaHandles.schema";
import { FormInput } from "~/components/FormInput/FormInput";

export const SocialMediaHandlesForm = ({
  defaultValues,
  menuId,
}: {
  defaultValues?: SocialMediaFormValues;
  menuId: string;
}) => {
  const { t } = useTranslation();
  const form = useForm<SocialMediaFormValues>({
    defaultValues: {
      facebookUrl: "",
      instagramUrl: "",
      googleReviewUrl: "",
      ...defaultValues,
    },
    resolver: zodResolver(socialMediaValidationSchema),
  });
  const { mutateAsync, isLoading } = api.menus.updateMenuSocials.useMutation();
  const { toast } = useToast();
  const onSubmit = async (values: SocialMediaFormValues) => {
    try {
      await mutateAsync({ ...values, menuId });
      toast({
        title: t("socialMediaForm.updatedToastTitle"),
        description: t("socialMediaForm.updatedToastDescription"),
      });
    } catch {
      toast({
        title: t("toastCommon.errorTitle"),
        description: t("toastCommon.errorDescription"),
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="facebookUrl"
            render={({ field }) => (
              <FormInput className="w-full" messageClassName="text-xs">
                <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                  <Icons.facebook className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <Input
                    {...field}
                    placeholder={t("socialMediaForm.facebookPlaceholder")}
                    className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  />
                </div>
              </FormInput>
            )}
          />

          <FormField
            control={form.control}
            name="instagramUrl"
            render={({ field }) => (
              <FormInput className="w-full" messageClassName="text-xs">
                <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                  <Icons.instagram className="h-5 w-5 flex-shrink-0 text-pink-600" />
                  <Input
                    {...field}
                    placeholder={t("socialMediaForm.instagramPlaceholder")}
                    className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  />
                </div>
              </FormInput>
            )}
          />

          <FormField
            control={form.control}
            name="googleReviewUrl"
            render={({ field }) => (
              <FormInput className="w-full" messageClassName="text-xs">
                <div className="relative flex items-center gap-2.5 rounded-lg border border-border/50 bg-background px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                  <Icons.google className="h-5 w-5 flex-shrink-0 text-red-500" />
                  <Input
                    {...field}
                    placeholder={t("socialMediaForm.googlePlaceholder")}
                    className="h-auto border-0 bg-transparent p-0 pr-8 text-sm shadow-none focus-visible:ring-0"
                  />
                  <GoogleReviewGuideButton />
                </div>
              </FormInput>
            )}
          />
        </div>
        <Button
          type="submit"
          variant="default"
          size="sm"
          className="w-full rounded-lg"
          loading={isLoading}
        >
          {t("socialMediaForm.save")}
        </Button>
      </form>
    </Form>
  );
};
