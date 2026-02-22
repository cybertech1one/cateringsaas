"use client";

import dynamic from "next/dynamic";

const CalendarView = dynamic(
  () => import("~/pageComponents/CalendarView/CalendarView.page"),
  { ssr: false }
);

export default function CalendarPage() {
  return <CalendarView />;
}
