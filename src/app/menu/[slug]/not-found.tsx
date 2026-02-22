import Link from "next/link";
import { useServerTranslation } from "~/i18n";

export default async function MenuNotFound() {
  const { t } = await useServerTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-6xl font-bold text-foreground">404</h1>
        <p className="text-2xl font-medium text-foreground">
          {t("notFound.menuNotFound")}
        </p>
        <p className="max-w-md text-muted-foreground">
          {t("notFound.menuNotFoundDescription")}
        </p>
        <Link href="/" className="mt-4 text-lg text-muted-foreground underline hover:text-foreground">
          {t("notFound.goBack")}
        </Link>
      </div>
    </div>
  );
}
