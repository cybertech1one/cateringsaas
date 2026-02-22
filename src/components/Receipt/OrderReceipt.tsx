"use client";

import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { Printer, X } from "lucide-react";

interface OrderReceiptProps {
  restaurantName: string;
  order: {
    orderNumber: number;
    createdAt: Date;
    items: {
      dishName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
    totalAmount: number;
    deliveryFee: number | null;
    currency: string;
    paymentMethod: string | null;
    paymentStatus: string;
    customerName: string | null;
    tableNumber: string | null;
  };
  onClose: () => void;
}

export function OrderReceipt({ restaurantName, order, onClose }: OrderReceiptProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  const handlePrint = () => {
    window.print();
  };

  const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = order.deliveryFee ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:static print:bg-transparent">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl print:mx-0 print:max-w-none print:rounded-none print:shadow-none dark:bg-card print:dark:bg-white">
        {/* Close button - hidden in print */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted print:hidden"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Receipt content */}
        <div className="space-y-4 text-sm print:text-black">
          {/* Restaurant name header */}
          <div className="border-b border-dashed border-gray-300 pb-4 text-center">
            <h2 className="text-xl font-bold">{restaurantName}</h2>
            <p className="mt-1 text-xs text-muted-foreground print:text-gray-500">
              {t("payment.receipt")}
            </p>
          </div>

          {/* Order info */}
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-3">
            <div>
              <p className="font-semibold">
                {t("ordersManagement.orderNumber", { number: order.orderNumber })}
              </p>
              {order.customerName && (
                <p className="text-muted-foreground print:text-gray-500">
                  {order.customerName}
                </p>
              )}
              {order.tableNumber && (
                <p className="text-muted-foreground print:text-gray-500">
                  {t("ordersManagement.table")}: {order.tableNumber}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-muted-foreground print:text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-muted-foreground print:text-gray-500">
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 border-b border-dashed border-gray-300 pb-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>
                  {item.quantity}x {item.dishName}
                </span>
                <span className="tabular-nums">
                  {(item.totalPrice / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 border-b border-dashed border-gray-300 pb-3">
            <div className="flex justify-between">
              <span>{t("ordering.subtotal")}</span>
              <span className="tabular-nums">
                {(subtotal / 100).toFixed(2)} {order.currency}
              </span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>{t("cart.deliveryFee")}</span>
                <span className="tabular-nums">
                  {(deliveryFee / 100).toFixed(2)} {order.currency}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-lg font-bold">
              <span>{t("ordersManagement.total")}</span>
              <span className="tabular-nums">
                {(order.totalAmount / 100).toFixed(2)} {order.currency}
              </span>
            </div>
          </div>

          {/* Payment info */}
          <div className="text-center text-xs text-muted-foreground print:text-gray-500">
            <p>
              {t("payment.paymentMethod")}: {t(`payment.${order.paymentMethod ?? "cash"}`)}
            </p>
            <p>
              {t("payment.status")}: {order.paymentStatus === "paid" ? t("payment.paid") : t("payment.unpaid")}
            </p>
            <p className="mt-3 text-[10px]">
              Powered by Diyafa
            </p>
          </div>
        </div>

        {/* Print button - hidden in print */}
        <div className="mt-6 flex gap-3 print:hidden">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onClose}
          >
            {t("menuOperations.cancel")}
          </Button>
          <Button
            className="flex-1 rounded-full"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            {t("payment.printReceipt")}
          </Button>
        </div>
      </div>
    </div>
  );
}
