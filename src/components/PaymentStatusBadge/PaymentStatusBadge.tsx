"use client";

import { useTranslation } from "react-i18next";
import { Banknote, CheckCircle2 } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: string;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  const isPaid = status === "paid";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isPaid
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      }`}
    >
      {isPaid ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <Banknote className="h-3 w-3" />
      )}
      {isPaid ? t("payment.paid") : t("payment.unpaid")}
    </span>
  );
}
