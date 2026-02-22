"use client";

import dynamic from "next/dynamic";

const EquipmentManagement = dynamic(
  () => import("~/pageComponents/EquipmentManagement/EquipmentManagement.page"),
  { ssr: false }
);

export default function EquipmentPage() {
  return <EquipmentManagement />;
}
