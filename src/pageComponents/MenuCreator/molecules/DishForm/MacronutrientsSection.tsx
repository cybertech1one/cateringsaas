import { type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormInput } from "~/components/FormInput/FormInput";
import { FormField } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { NutritionAIButton } from "./AIAssistButtons";
import { type AddDishFormValuesWithImage } from "./DishForm.schema";

interface MacronutrientsSectionProps {
  form: UseFormReturn<AddDishFormValuesWithImage>;
}

export function MacronutrientsSection({ form }: MacronutrientsSectionProps) {
  const { t } = useTranslation();

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          {t("dishForm.macronutrientsButton")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-4 p-4 ">
            <div className="flex justify-end">
              <NutritionAIButton form={form} />
            </div>
            <div className="flex flex-row justify-between gap-4">
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormInput
                    label={t("dishForm.calories")}
                    className="w-full"
                  >
                    <Input {...field} type="number" />
                  </FormInput>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormInput
                    label={t("dishForm.weight")}
                    className="w-full"
                  >
                    <Input {...field} type="number" />
                  </FormInput>
                )}
              />
            </div>
            <div className="flex flex-row gap-4">
              <FormField
                control={form.control}
                name="carbohydrates"
                render={({ field }) => (
                  <FormInput label={t("dishForm.carbs")}>
                    <Input {...field} type="number" />
                  </FormInput>
                )}
              />
              <FormField
                control={form.control}
                name="fats"
                render={({ field }) => (
                  <FormInput label={t("dishForm.fat")}>
                    <Input {...field} type="number" />
                  </FormInput>
                )}
              />
              <FormField
                control={form.control}
                name="proteins"
                render={({ field }) => (
                  <FormInput label={t("dishForm.protein")}>
                    <Input {...field} type="number" />
                  </FormInput>
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dishForm.macronutrientsDescription")}
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
