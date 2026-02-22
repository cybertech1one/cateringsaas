"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MessageCircle, Phone, ArrowLeft, History, Gift, Star, Printer } from "lucide-react";
import { api } from "~/trpc/react";
import { shimmerToBase64 } from "~/utils/shimmer";
import { OrderStatusStepper } from "./molecules/OrderStatusStepper";
import { OrderSummaryCard } from "./molecules/OrderSummaryCard";
import { OrderETADisplay } from "./molecules/OrderETADisplay";
import { PrintableReceipt } from "./molecules/PrintableReceipt";
import { PushNotificationOptIn } from "~/components/PushNotificationOptIn/PushNotificationOptIn";
import { DeliveryDriverCard } from "./molecules/DeliveryDriverCard";
import { DeliveryStatusTimeline } from "./molecules/DeliveryStatusTimeline";
import { DeliveryETACountdown } from "./molecules/DeliveryETACountdown";
import { RateDriverForm } from "./molecules/RateDriverForm";

interface OrderTrackingPageProps {
  orderId: string;
}

export function OrderTrackingPage({ orderId }: OrderTrackingPageProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  const { data, isLoading, error } =
    api.orders.getPublicOrderStatus.useQuery(
      { orderId },
      {
        refetchInterval: (queryData) => {
          const status = queryData?.status;

          if (status === "completed" || status === "cancelled") return false;

          return 15_000;
        },
      },
    );

  // Delivery tracking - only polls when order is a delivery type
  const isDeliveryOrder = data?.orderType === "delivery";
  const { data: deliveryData } = api.delivery.getDeliveryByOrderId.useQuery(
    { orderId },
    {
      enabled: isDeliveryOrder,
      refetchInterval: (queryData) => {
        if (!queryData) return 10_000;
        const status = queryData.status;

        if (status === "delivered" || status === "cancelled" || status === "failed") {
          return false;
        }

        return 10_000;
      },
    },
  );

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center bg-background"
        role="status"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("orderTracking.notFound.title")}
          </h1>
          <p className="max-w-md text-muted-foreground">
            {t("orderTracking.notFound.description")}
          </p>
          <Link
            href="/"
            className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("orderTracking.notFound.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const orderTypeKey = data.orderType as "dine_in" | "pickup" | "delivery";
  const paymentLabel = data.paymentMethod
    ? getPaymentLabel(data.paymentMethod, t)
    : null;

  return (
    <>
      {/* Printable receipt - hidden on screen, shown only when printing */}
      <PrintableReceipt
        restaurantName={data.restaurantName}
        restaurantLogo={data.restaurantLogo}
        orderNumber={data.orderNumber}
        createdAt={data.createdAt as unknown as string}
        items={data.items}
        totalAmount={data.totalAmount}
        deliveryFee={data.deliveryFee}
        currency={data.currency}
        paymentMethod={data.paymentMethod}
        orderType={data.orderType}
        tableNumber={data.tableNumber}
        customerName={data.customerName}
        t={t}
      />

      {/* Screen content - hidden when printing */}
      <div className="order-tracking-screen min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 py-6">
          {/* Back link */}
          {data.restaurantSlug && (
            <Link
              href={`/menu/${data.restaurantSlug}`}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {data.restaurantName}
            </Link>
          )}

          {/* Restaurant header */}
          <div className="mb-6 flex items-center gap-3">
            {data.restaurantLogo && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/50">
                <Image
                  src={data.restaurantLogo}
                  fill
                  alt={`${data.restaurantName} logo`}
                  className="object-cover"
                  sizes="48px"
                  placeholder="blur"
                  blurDataURL={shimmerToBase64(48, 48)}
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {t("orderTracking.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("orderTracking.orderNumber", {
                  number: data.orderNumber,
                })}
              </p>
            </div>
          </div>

          {/* Order type + payment info */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {t(`orderTracking.orderType.${orderTypeKey}`)}
            </span>
            {paymentLabel && (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {paymentLabel}
              </span>
            )}
            {data.customerName && (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {data.customerName}
              </span>
            )}
          </div>

          {/* ETA Display - show delivery ETA for delivery orders, order ETA otherwise */}
          <div className="mb-4">
            {isDeliveryOrder && deliveryData ? (
              <DeliveryETACountdown
                estimatedDuration={deliveryData.estimatedDuration}
                createdAt={deliveryData.createdAt as unknown as string}
                status={deliveryData.status}
                t={t}
              />
            ) : (
              <OrderETADisplay
                status={data.status}
                orderType={data.orderType}
                estimatedMinutes={data.estimatedMinutes}
                ordersAhead={data.ordersAhead}
                t={t}
              />
            )}
          </div>

          {/* Delivery Driver Card */}
          {isDeliveryOrder && deliveryData?.driver && (
            <div className="mb-4">
              <DeliveryDriverCard
                fullName={deliveryData.driver.fullName}
                phone={deliveryData.driver.phone}
                vehicleType={deliveryData.driver.vehicleType}
                profilePhotoUrl={deliveryData.driver.profilePhotoUrl}
                rating={deliveryData.driver.rating}
                t={t}
              />
            </div>
          )}

          {/* Delivery Status Timeline */}
          {isDeliveryOrder && deliveryData && (
            <div className="mb-4">
              <DeliveryStatusTimeline
                status={deliveryData.status}
                pickedUpAt={deliveryData.pickedUpAt as unknown as string | null}
                deliveredAt={deliveryData.deliveredAt as unknown as string | null}
                t={t}
              />
            </div>
          )}

          {/* Push Notification Opt-In */}
          {data.status !== "completed" && data.status !== "cancelled" && (
            <div className="mb-4">
              <PushNotificationOptIn orderId={orderId} t={t} />
            </div>
          )}

          {/* Order Status Stepper - show for non-delivery or fallback */}
          {!isDeliveryOrder && (
          <div className="mb-4">
            <OrderStatusStepper
              status={
                data.status as
                  | "pending"
                  | "confirmed"
                  | "preparing"
                  | "ready"
                  | "completed"
                  | "cancelled"
              }
              createdAt={data.createdAt as unknown as string}
              confirmedAt={data.confirmedAt as unknown as string | null}
              preparingAt={data.preparingAt as unknown as string | null}
              readyAt={data.readyAt as unknown as string | null}
              completedAt={data.completedAt as unknown as string | null}
              t={t}
            />
          </div>
          )}

          {/* Rate Driver - shown after delivery is complete */}
          {isDeliveryOrder && deliveryData && deliveryData.status === "delivered" && (
            <div className="mb-4">
              <RateDriverForm
                deliveryId={deliveryData.id}
                existingRating={deliveryData.rating}
                t={t}
              />
            </div>
          )}

          {/* Order Summary */}
          <div className="mb-4">
            <OrderSummaryCard
              items={data.items}
              totalAmount={data.totalAmount}
              deliveryFee={data.deliveryFee}
              currency={data.currency}
              tableNumber={data.tableNumber}
              orderType={data.orderType}
              t={t}
            />
          </div>

          {/* Print Receipt button - only for completed orders */}
          {data.status === "completed" && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Printer className="h-4 w-4" />
                {t("orderTracking.printReceipt")}
              </button>
            </div>
          )}

          {/* Delivery address */}
          {data.orderType === "delivery" && data.deliveryAddress && (
            <div className="mb-4 rounded-xl border border-border/50 bg-card px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Delivery address
              </p>
              <p className="mt-1 text-sm text-foreground">
                {data.deliveryAddress}
              </p>
            </div>
          )}

          {/* Contact / Help */}
          {(data.whatsappNumber || data.restaurantPhone) && (
            <div className="rounded-xl border border-border/50 bg-card px-5 py-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                {t("orderTracking.help.needHelp")}
              </p>
              <div className="flex flex-wrap gap-2">
                {data.whatsappNumber && (
                  <a
                    href={`https://wa.me/${data.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I have a question about order #${data.orderNumber}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t("orderTracking.help.whatsapp")}
                  </a>
                )}
                {data.restaurantPhone && (
                  <a
                    href={`tel:${data.restaurantPhone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Phone className="h-4 w-4" />
                    {t("orderTracking.help.contactRestaurant")}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Loyalty Progress - shown after order is completed */}
          {data.status === "completed" && data.customerPhone && data.menuId && (
            <div className="mt-4">
              <LoyaltyProgressSection
                menuId={data.menuId}
                customerPhone={data.customerPhone}
                t={t}
              />
            </div>
          )}

          {/* Order History Link */}
          {data.customerPhone && (
            <div className="mt-4 text-center">
              <Link
                href={`/order/history?phone=${encodeURIComponent(data.customerPhone)}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <History className="h-4 w-4" />
                {t("orderHistory.viewOrderHistory")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LoyaltyProgressSection({
  menuId,
  customerPhone,
  t,
}: {
  menuId: string;
  customerPhone: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { data: loyaltyData } = api.loyalty.getCustomerLoyalty.useQuery(
    { menuId, phone: customerPhone },
  );

  if (!loyaltyData || loyaltyData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {loyaltyData.map((program) => {
        const remaining = program.stampsRequired - program.stampsCollected;

        return (
          <div
            key={program.programId}
            className="rounded-xl border border-border/50 bg-card px-5 py-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: `${program.color ?? "#8b5cf6"}20` }}
              >
                <Gift
                  className="h-4 w-4"
                  style={{ color: program.color ?? "#8b5cf6" }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {t("loyalty.auto.stampEarned")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {program.programName}
                </p>
              </div>
            </div>

            {/* Stamp dots */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {Array.from({ length: program.stampsRequired }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                    i < program.stampsCollected
                      ? "border-transparent"
                      : "border-border bg-muted/50"
                  }`}
                  style={
                    i < program.stampsCollected
                      ? { backgroundColor: program.color ?? "#8b5cf6" }
                      : undefined
                  }
                >
                  {i < program.stampsCollected && (
                    <Star className="h-3.5 w-3.5 fill-white text-white" />
                  )}
                </div>
              ))}
            </div>

            {/* Progress text */}
            <p className="text-sm text-muted-foreground">
              {t("loyalty.auto.progress", {
                current: program.stampsCollected,
                total: program.stampsRequired,
              })}
            </p>

            {/* Reward status */}
            {program.isRedeemable && (
              <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {t("loyalty.auto.rewardReady")}
                </p>
                <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/70">
                  {program.rewardDescription}
                </p>
              </div>
            )}
            {!program.isRedeemable && remaining > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("loyalty.auto.almostThere", { remaining })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getPaymentLabel(
  method: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string | null {
  const paymentMap: Record<string, string> = {
    cash: "orderTracking.payment.cash",
    pay_at_table: "orderTracking.payment.payAtTable",
    pay_at_counter: "orderTracking.payment.payAtCounter",
    pay_on_delivery: "orderTracking.payment.payOnDelivery",
  };

  const key = paymentMap[method];

  if (!key) return method;

  return t(key);
}
