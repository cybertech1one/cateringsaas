import Link from "next/link";
import { Navbar } from "~/components/Navbar/Navbar";
import { useServerTranslation } from "~/i18n";

export default async function CityNotFound() {
  const { t } = await useServerTranslation();

  return (
    <>
      <Navbar />
      <div className="-mt-6 flex grow items-center justify-center bg-background">
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <h1 className="font-display text-8xl font-bold text-foreground">
            404
          </h1>
          <p className="text-4xl font-medium text-foreground">
            {t("explore.cityNotFound", "City not found")}
          </p>
          <p className="mt-2 text-lg text-muted-foreground">
            {t(
              "explore.cityNotFoundDescription",
              "The city you are looking for does not exist in our directory.",
            )}
          </p>
          <Link
            href="/explore"
            className="mt-4 text-xl text-muted-foreground underline hover:text-foreground"
          >
            {t("explore.backToExplore", "Back to Explore")}
          </Link>
        </div>
      </div>
    </>
  );
}
