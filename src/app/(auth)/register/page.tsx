import { type Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Register",
  description: "Create your FeastQR account and start building beautiful digital menus for your restaurant",
};

export { Register as default } from "~/pageComponents/Register/Register.page";
