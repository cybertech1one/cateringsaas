import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Orders",
  description: "View and manage customer orders in real-time.",
};

const OrdersManagementPage = nextDynamic(
  () => import("~/pageComponents/OrdersManagement/OrdersManagement.page").then((mod) => ({ default: mod.OrdersManagementPage })),
  { loading: () => <LoadingScreen /> },
);

export default function OrdersPage() {
  return <OrdersManagementPage />;
}
