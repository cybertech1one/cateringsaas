import { FormField } from "~/components/ui/form";
import { Switch } from "~/components/ui/switch";
import { FormInput } from "~/components/FormInput/FormInput";
import { Input } from "~/components/ui/input";
import { Icons } from "~/components/Icons";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { type PrintCreatorFormValues } from "../../MenuPrintCreator.schema";

export const MenuOptionsForm = () => {
  const form = useFormContext<PrintCreatorFormValues>();
  const { t: rawT } = useTranslation("common");
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;

  return (
    <div className="flex w-full max-w-[300px] grow flex-col gap-8">
      <h1 className=" text-3xl font-bold ">{t("menuPrintCreator.title")}</h1>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-end gap-3 rounded-md border p-4">
          <FormInput
            descriptionClassName="text-xs"
            label={t("menuPrintCreator.socialMediaLabel")}
            description={t("menuPrintCreator.socialMediaDescription")}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center gap-2">
                <Icons.facebook className="h-6 w-6" />
                <Input placeholder={t("menuPrintCreator.facebookHandlePlaceholder")} className="h-7 w-full" />
                <Switch />
              </div>

              <div className="flex flex-row items-center gap-2">
                <Icons.instagram className="h-6 w-6" />
                <Input placeholder={t("menuPrintCreator.instagramHandlePlaceholder")} className="h-7 w-full" />
                <Switch />
              </div>

              <div className="flex flex-row items-center gap-2">
                <Icons.google className="h-6 w-6" />
                <Input placeholder={t("menuPrintCreator.googleHandlePlaceholder")} className="h-7 w-full" />
                <Switch />
              </div>
            </div>
          </FormInput>
        </div>
        <div className="flex flex-col items-start justify-end gap-3 rounded-md border p-4">
          <FormInput
            descriptionClassName="text-xs"
            label={t("menuPrintCreator.wifiPasswordLabel")}
            description={t("menuPrintCreator.wifiPasswordDescription")}
          >
            <div className="flex flex-row items-center gap-2">
              <Icons.wifi className="h-6 w-6" />
              <Input placeholder={t("menuPrintCreator.wifiPasswordPlaceholder")} className="h-7 w-full" />
              <Switch />
            </div>
          </FormInput>
        </div>
        <FormField
          control={form.control}
          name="restaurantNameEnabled"
          render={({ field }) => (
            <FormInput
              label={t("menuPrintCreator.restaurantNameLabel")}
              className="flex flex-row items-center justify-between gap-2 space-y-0 rounded-md border p-4"
            >
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormInput>
          )}
        />
        <FormField
          control={form.control}
          name="qrCodeEnabled"
          render={({ field }) => (
            <FormInput
              label={t("menuPrintCreator.qrCodeEnabledLabel")}
              className="flex flex-row items-center justify-between gap-2 space-y-0 rounded-md border p-4 text-center"
            >
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormInput>
          )}
        />
      </div>
    </div>
  );
};
