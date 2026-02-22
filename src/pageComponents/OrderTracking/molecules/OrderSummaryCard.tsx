"use client";

import { formatPrice } from "~/utils/currency";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
}

interface OrderSummaryCardProps {
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number | null;
  currency: string | null;
  tableNumber: string | null;
  orderType: string | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function OrderSummaryCard({
  items,
  totalAmount,
  deliveryFee,
  currency,
  tableNumber,
  orderType,
  t,
}: OrderSummaryCardProps) {
  const cur = currency ?? "MAD";
  const subtotal = totalAmount - (deliveryFee ?? 0);

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      {/* Header */}
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="font-sans text-base font-semibold">
          {t("orderTracking.summary.items")}
        </h3>
        {orderType === "dine_in" && tableNumber && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("orderTracking.summary.table", { number: tableNumber })}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-border/30 px-5">
        {items.map((item, index) => (
          <div key={index} className="flex items-start justify-between py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
                  {item.quantity}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {item.name}
                </span>
              </div>
              {item.notes && (
                <p className="mt-1 pl-7 text-xs text-muted-foreground">
                  {item.notes}
                </p>
              )}
            </div>
            <span className="ml-4 shrink-0 text-sm font-medium tabular-nums text-foreground">
              {formatPrice(item.totalPrice, cur)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border/50 px-5 py-4">
        {deliveryFee != null && deliveryFee > 0 && (
          <>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {formatPrice(subtotal, cur)}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-muted-foreground">
              <span>{t("orderTracking.summary.deliveryFee")}</span>
              <span className="tabular-nums">
                {formatPrice(deliveryFee, cur)}
              </span>
            </div>
            <div className="my-2 h-px bg-border/50" />
          </>
        )}
        <div className="flex justify-between">
          <span className="font-sans text-base font-semibold">
            {t("orderTracking.summary.total")}
          </span>
          <span className="font-sans text-base font-semibold tabular-nums">
            {formatPrice(totalAmount, cur)}
          </span>
        </div>
      </div>
    </div>
  );
}
