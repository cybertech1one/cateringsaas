import { type Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Diyafa account to manage your restaurant menus",
};

export { Login as default } from "~/pageComponents/Login/Login.page";
