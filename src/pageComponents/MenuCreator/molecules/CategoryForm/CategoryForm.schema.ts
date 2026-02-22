import { z } from "zod";
import { type ZodReturnType } from "~/utils";

export const addCategoryValidationSchema = z.object({
  id: z.string().optional(),
  translatedCategoriesData: z.array(
    z.object({
      languageId: z.string(),
      name: z.string().min(1).max(100),
    }),
  ),
});

export type AddCategoryFormValues = ZodReturnType<
  typeof addCategoryValidationSchema
>;
