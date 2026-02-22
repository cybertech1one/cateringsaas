import Image from "next/image";
import Icon from "~/assets/icon.png";
import Link from "next/link";
import { useServerTranslation } from "~/i18n";

export const Footer = async () => {
  const { t } = await useServerTranslation();

  return (
    <footer className="zellige-divider bg-sand-section">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <nav aria-label="Footer navigation" className="grid gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src={Icon} width={32} height={32} alt="FeastQR Logo" />
              <div>
                <span className="font-sans text-lg font-bold tracking-tight">
                  FeastQR
                  <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">{t("footer.tagline")}</p>
              </div>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.description")}
            </p>

            {/* Decorative 8-pointed star */}
            <svg
              className="mt-4 w-8 h-8 text-primary/10"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">{t("footer.product")}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.explore")}</Link></li>
              <li><Link href="/for-restaurants" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.forRestaurants")}</Link></li>
              <li><Link href="/for-drivers" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.forDrivers")}</Link></li>
              <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.pricing")}</Link></li>
              <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.signIn")}</Link></li>
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">{t("footer.popularCities")}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/explore/casablanca" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.casablanca")}</Link></li>
              <li><Link href="/explore/marrakech" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.marrakech")}</Link></li>
              <li><Link href="/explore/rabat" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.rabat")}</Link></li>
              <li><Link href="/explore/fes" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.fes")}</Link></li>
            </ul>
          </div>

          {/* Legal + Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">{t("footer.legal")}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.privacyPolicy")}</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.termsOfService")}</Link></li>
              <li><Link href="/refund-policy" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.refundPolicy")}</Link></li>
            </ul>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4 mt-8">{t("footer.contact")}</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="mailto:support@feastqr.com" className="text-muted-foreground hover:text-foreground transition-colors">support@feastqr.com</a></li>
            </ul>
          </div>
        </nav>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 pt-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FeastQR. {t("footer.allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
};
