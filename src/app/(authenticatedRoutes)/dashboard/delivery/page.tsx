import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery Management",
  description:
    "Manage delivery requests, drivers, and auto-dispatch for your restaurant.",
};

const DeliveryManagementPage = nextDynamic(
  () =>
    import(
      "~/pageComponents/DeliveryManagement/DeliveryManagement.page"
    ).then((mod) => ({ default: mod.DeliveryManagementPage })),
  { loading: () => <LoadingScreen /> },
);

export default function DeliveryPage() {
  return <DeliveryManagementPage />;
}
