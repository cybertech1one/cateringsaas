import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Driver Management",
  description:
    "Review and manage driver applications, approve or reject drivers.",
};

const AdminDriverPanel = nextDynamic(
  () =>
    import(
      "~/pageComponents/DeliveryManagement/molecules/AdminDriverPanel"
    ).then((mod) => ({ default: mod.AdminDriverPanel })),
  { loading: () => <LoadingScreen /> },
);

export default function DriversAdminPage() {
  return <AdminDriverPanel />;
}
