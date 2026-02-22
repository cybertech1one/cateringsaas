"use client";

import dynamic from "next/dynamic";
import type { Metadata } from "next";

const EventsManagement = dynamic(
  () => import("~/pageComponents/EventsManagement/EventsManagement.page"),
  { ssr: false }
);

export default function EventsPage() {
  return <EventsManagement />;
}
