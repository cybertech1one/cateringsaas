import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/providers/AuthProvider/AuthProvider";
import { generateDishImagePath } from "~/server/supabase/storagePaths";
import { api } from "~/trpc/react";
import { assert } from "~/utils/assert";
import { uploadFileToStorage } from "~/utils/uploadFile";
import { type AddDishFormValuesWithImage } from "./DishForm.schema";

export const useUpsertDish = () => {
  const { user } = useUser();
  const { mutateAsync } = api.menus.upsertDish.useMutation();
  const { mutateAsync: updateBgImage } =
    api.menus.updateDishImageUrl.useMutation();
  const utils = api.useContext();

  const { slug } = useParams() as { slug: string };
  const { data: menuData } = api.menus.getMenuBySlug.useQuery({ slug });
  const { t } = useTranslation();
  const { toast } = useToast();
  const upsertDish = async (values: AddDishFormValuesWithImage) => {
    try {
      assert(!!user, "User should be logged in.");
      assert(!!menuData, "Menu should be fetched.");
      const { dishImageToUpload, ...dish } = values;

      const newDish = await mutateAsync({ ...dish, menuId: menuData.id });
      let imageUrl: string | undefined | null;

      if (dishImageToUpload) {
        const { url, error } = await uploadFileToStorage(
          generateDishImagePath({
            dishId: newDish.id,
            userId: user.id,
          }),
          dishImageToUpload,
        );

        if (error) throw error;

        imageUrl = url;
      } else if (dishImageToUpload === null) {
        imageUrl = null;
      }

      await updateBgImage({ dishId: newDish.id, imageUrl });
      utils.menus.invalidate();
      toast({
        title: t("toast.dishSaved"),
        description: t("toast.dishSavedDescription"),
      });
    } catch (error) {
      toast({
        title: t("notifications.somethingWentWrong"),
        description: t("notifications.tryAgainLater"),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return { mutateAsync: upsertDish };
};
