"use client";

import dynamic from "next/dynamic";

const ClientsManagement = dynamic(
  () => import("~/pageComponents/ClientsManagement/ClientsManagement.page"),
  { ssr: false }
);

export default function ClientsPage() {
  return <ClientsManagement />;
}
