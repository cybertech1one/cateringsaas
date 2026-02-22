"use client";

import Image from "next/image";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Icons } from "~/components/Icons";
import { LoadingScreen } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { shimmerToBase64 } from "~/utils/shimmer";
import { DefaultLanguagesSelector } from "./molecules/DefaultLanguageSelector/DefaultLanguageSelector";
import { getDefaultLanguage } from "~/utils/getDefaultLanguage";
import { LanguagesSelector } from "./molecules/LanguagesSelector/LanguagesSelector";
import { useTranslation } from "react-i18next";
import { useUserSubscription } from "~/shared/hooks/useUserSubscription";
import { SocialMediaHandlesForm } from "./molecules/SocialMediaHandles/SocialMediaHandles";
import { openLemonSqueezy } from "~/utils/payments";
import {
  Eye,
  Edit,
  QrCode,
  Paintbrush,
  CalendarDays,
  FileEdit,
  Globe,
  Copy,
  CheckCircle,
  ExternalLink,
  Download,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useState, useCallback } from "react";

const OrderSettings = dynamic(
  () => import("./molecules/OrderSettings/OrderSettings").then((m) => m.OrderSettings),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-xl bg-muted" /> },
);

const QRCode = dynamic(
  () => import("qrcode.react"),
  { ssr: false, loading: () => <div className="h-[180px] w-[180px] animate-pulse rounded-xl bg-muted" /> },
);

export const RestaurantDashboard = ({
  params: { slug },
}: {
  params: { slug: string };
}) => {
  const { data, error, isLoading } = api.menus.getMenuBySlug.useQuery({ slug });
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();
  const { isSubscribed } = useUserSubscription();
  const {
    mutateAsync: createPremiumCheckout,
    isLoading: isCreatePremiumCheckoutLoading,
  } = api.payments.createPremiumCheckout.useMutation();
  const { mutateAsync: publishMenu } = api.menus.publishMenu.useMutation();
  const { mutateAsync: unpublishMenu } = api.menus.unpublishMenu.useMutation();
  const { i18n } = useTranslation();
  const [linkCopied, setLinkCopied] = useState(false);

  const menuUrl = `${getBaseUrl()}/menu/${data?.slug ?? slug}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setLinkCopied(true);
      toast({ title: t("restaurantDashboard.linkCopied") });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback: no clipboard API
    }
  }, [menuUrl, toast, t]);

  const handleTogglePublish = async () => {
    if (!data) return;

    try {
      if (data.isPublished) {
        await unpublishMenu({ menuId: data.id });
        toast({
          title: t("restaurantDashboard.menuUnpublishedNotification"),
          description: t("restaurantDashboard.menuUnpublishedNotificationDescription"),
        });
      } else {
        await publishMenu({ menuId: data.id });
        toast({
          title: t("restaurantDashboard.menuPublishedNotification"),
          description: t("restaurantDashboard.menuPublishedNotificationDescription"),
        });
      }
    } catch {
      toast({
        title: t("toast.error"),
        description: t("toast.errorDescription"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (error) {
    toast({
      title: t("toastCommon.errorTitle"),
      description: t("restaurantDashboard.menuNotFound"),
      variant: "destructive",
    });
    redirect("/dashboard");
  }

  return (
    <div className="flex w-full flex-col gap-6 py-4">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Banner */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-gold/15 md:h-52">
          {data.backgroundImageUrl && (
            <Image
              src={data.backgroundImageUrl}
              fill
              alt={`${data.name} restaurant background`}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
              priority
              placeholder="blur"
              blurDataURL={shimmerToBase64(900, 200)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        </div>

        {/* Info overlay */}
        <div className="relative -mt-16 px-5 pb-5 md:-mt-20 md:px-6 md:pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {/* Logo + Name */}
            <div className="flex items-end gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-4 border-background bg-card shadow-lg md:h-24 md:w-24">
                {data.logoImageUrl ? (
                  <Image
                    src={data.logoImageUrl}
                    fill
                    alt={`${data.name} logo`}
                    className="object-cover"
                    sizes="96px"
                    placeholder="blur"
                    blurDataURL={shimmerToBase64(96, 96)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Icons.utensils className="h-8 w-8 text-primary/60" />
                  </div>
                )}
              </div>
              <div className="mb-1 space-y-1">
                <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                  {data.name}
                </h1>
                {(data.city || data.address) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icons.map className="h-3.5 w-3.5" />
                    <span>{[data.city, data.address].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status + Action */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                data.isPublished
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}>
                <span className={`h-2 w-2 rounded-full ${data.isPublished ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {data.isPublished
                  ? t("restaurantDashboard.menuPublished")
                  : t("restaurantDashboard.menuNotPublished")}
              </div>
              {isSubscribed ? (
                <Button
                  size="sm"
                  onClick={handleTogglePublish}
                  variant={data.isPublished ? "outline" : "default"}
                  className="rounded-full px-5"
                >
                  {data.isPublished
                    ? t("restaurantDashboard.unpublish")
                    : t("restaurantDashboard.publish")}
                </Button>
              ) : (
                <Button
                  variant="default"
                  loading={isCreatePremiumCheckoutLoading}
                  size="sm"
                  className="rounded-full px-5"
                  onClick={async () => {
                    try {
                      const checkoutUrl = await createPremiumCheckout({
                        language: i18n.language as "en" | "fr" | "ar",
                      });

                      openLemonSqueezy(checkoutUrl);
                    } catch {
                      toast({
                        title: t("toast.error"),
                        description: t("toast.errorDescription"),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  {t("restaurantDashboard.upgradeAccount")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
          {t("restaurantDashboard.quickActions")}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <QuickAction
            icon={Eye}
            title={t("restaurantDashboard.menuPreview")}
            description={t("restaurantDashboard.previewMenuDesc")}
            href={`/menu/${data.slug}`}
            gradient="from-blue-500 to-blue-600"
            external
          />
          <QuickAction
            icon={Edit}
            title={t("restaurantDashboard.editMenu")}
            description={t("restaurantDashboard.editMenuDesc")}
            href={`/menu/manage/${slug}/menu`}
            gradient="from-emerald-500 to-emerald-600"
          />
          <QuickAction
            icon={QrCode}
            title={t("restaurantDashboard.yourQRCode")}
            description={t("restaurantDashboard.qrCodeDesc")}
            href={`/menu/manage/${slug}/qr-menu`}
            gradient="from-purple-500 to-purple-600"
          />
          <QuickAction
            icon={Paintbrush}
            title={t("restaurantDashboard.designTheme")}
            description={t("restaurantDashboard.designThemeDesc")}
            href={`/menu/manage/${slug}/design`}
            gradient="from-pink-500 to-rose-500"
          />
          <QuickAction
            icon={CalendarDays}
            title={t("restaurantDashboard.menuSchedule")}
            description={t("restaurantDashboard.menuScheduleDesc")}
            href={`/menu/manage/${slug}/schedule`}
            gradient="from-amber-500 to-orange-500"
          />
          <QuickAction
            icon={FileEdit}
            title={t("restaurantDashboard.editDetails")}
            description={t("restaurantDashboard.editDetailsDesc")}
            href={`/menu/manage/${slug}/edit`}
            gradient="from-slate-500 to-slate-600"
          />
        </div>
      </div>

      {/* ── Main Content: QR Code + Settings ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* QR Code Card - 2 cols */}
        <div className="lg:col-span-2">
          <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <QrCode className="h-4.5 w-4.5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">{t("restaurantDashboard.qrCodeSection")}</h3>
                <p className="text-xs text-muted-foreground">{t("restaurantDashboard.qrCodeSectionDesc")}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl bg-white p-6">
              <QRCode
                size={180}
                value={menuUrl}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Menu link */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-xs text-muted-foreground">{menuUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {linkCopied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <Link
                href={menuUrl}
                target="_blank"
                className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                onClick={() => router.push(`/menu/manage/${slug}/qr-menu`)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {t("restaurantDashboard.downloadQR")}
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {linkCopied ? <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {t("restaurantDashboard.copyLink")}
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Cards - 3 cols */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Languages Card */}
          <SettingsCard
            icon={Globe}
            iconColor="text-blue-600 bg-blue-500/10"
            title={t("restaurantDashboard.availableLanguages")}
            description={t("restaurantDashboard.languagesDesc")}
          >
            <LanguagesSelector
              menuId={data.id}
              initialLanguages={data.menuLanguages.map(
                (lang) => lang.languageId,
              )}
            />
          </SettingsCard>

          {/* Default Language Card */}
          <SettingsCard
            icon={Icons.flag}
            iconColor="text-amber-600 bg-amber-500/10"
            title={t("restaurantDashboard.defaultLanguage")}
            description={t("restaurantDashboard.defaultLanguageDesc")}
          >
            <DefaultLanguagesSelector
              menuId={data.id}
              initialDefaultLanguage={
                getDefaultLanguage(data.menuLanguages).languageId
              }
            />
          </SettingsCard>

          {/* Social Media Card */}
          <SettingsCard
            icon={Icons.globe}
            iconColor="text-pink-600 bg-pink-500/10"
            title={t("socialMediaForm.title")}
            description={t("restaurantDashboard.socialMediaDesc")}
          >
            <SocialMediaHandlesForm
              menuId={data.id}
              defaultValues={{
                facebookUrl: data.facebookUrl ?? "",
                instagramUrl: data.instagramUrl ?? "",
                googleReviewUrl: data.googleReviewUrl ?? "",
              }}
            />
          </SettingsCard>

          {/* Order Settings Card */}
          <SettingsCard
            icon={ShoppingCart}
            iconColor="text-orange-600 bg-orange-500/10"
            title={t("orderSettings.title")}
            description={t("orderSettings.description")}
          >
            <OrderSettings menuId={data.id} />
          </SettingsCard>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Quick Action Card                                                  */
/* ------------------------------------------------------------------ */

function QuickAction({
  icon: Icon,
  title,
  description,
  href,
  gradient,
  external,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  gradient: string;
  external?: boolean;
}) {
  return (
    <Link href={href} target={external ? "_blank" : undefined}>
      <div className="hover-lift group flex h-full flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-card">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings Card wrapper                                              */
/* ------------------------------------------------------------------ */

function SettingsCard({
  icon: Icon,
  iconColor,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
