import Link from "next/link";
import { Navbar } from "~/components/Navbar/Navbar";
import { useServerTranslation } from "~/i18n";

export default async function NotFound() {
  const { t } = await useServerTranslation();

  return (
    <>
      <Navbar />
      <div className="-mt-6 flex grow items-center justify-center bg-background">
        <div className="flex h-full flex-col items-center justify-center">
          <h1 className="font-display text-8xl font-bold text-foreground">404</h1>
          <p className="text-4xl font-medium text-foreground">
            {t("notFound.title")}
          </p>
          <Link href="/" className="mt-4 text-xl text-muted-foreground underline hover:text-foreground">
            {t("notFound.goBack")}
          </Link>
        </div>
      </div>
    </>
  );
}
