"use client";

import dynamic from "next/dynamic";

const MessagesCenter = dynamic(
  () => import("~/pageComponents/MessagesCenter/MessagesCenter.page"),
  { ssr: false }
);

export default function MessagesPage() {
  return <MessagesCenter />;
}
