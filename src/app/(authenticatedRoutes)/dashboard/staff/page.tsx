import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Staff Management",
  description: "Manage staff access and role-based permissions.",
};

const StaffManagementPage = nextDynamic(
  () => import("~/pageComponents/StaffManagement/StaffManagement.page").then((mod) => ({ default: mod.StaffManagementPage })),
  { loading: () => <LoadingScreen /> },
);

export default function StaffPage() {
  return <StaffManagementPage />;
}
