import { type Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your Diyafa account settings and preferences.",
};

export { default } from "~/pageComponents/Settings/SettingsPage";
