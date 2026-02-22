"use client";

import dynamic from "next/dynamic";

const PortfolioManagement = dynamic(
  () => import("~/pageComponents/PortfolioManagement/PortfolioManagement.page"),
  { ssr: false }
);

export default function PortfolioPage() {
  return <PortfolioManagement />;
}
