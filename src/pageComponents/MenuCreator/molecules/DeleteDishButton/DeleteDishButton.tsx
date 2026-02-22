import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

export const DeleteDishButton = ({
  dishName,
  id,
}: {
  dishName: string;
  id: string;
}) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const { mutateAsync } = api.menus.deleteDish.useMutation();
  const { toast } = useToast();
  const utils = api.useContext();
  const onDelete = async () => {
    try {
      await mutateAsync({ dishId: id });
      utils.menus.invalidate();
      toast({
        title: t("toast.dishDeleted"),
        description: t("toast.dishDeletedDescription"),
      });
    } catch {
      toast({
        title: t("toast.error"),
        description: t("toast.errorDescription"),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AlertDialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">{t("deleteDishButton.delete")}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteDishButton.deleteDish")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {t("deleteDishButton.areYouSureYouWantToDeleteThisDish")} {dishName}
            ?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("deleteDishButton.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setModalOpen(false);
              }}
            >
              {t("deleteDishButton.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
