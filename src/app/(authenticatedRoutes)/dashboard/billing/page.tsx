import { type Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your Diyafa subscription plan and billing information.",
};

export { BillingPage as default } from "~/pageComponents/Billing/Billing.page";
