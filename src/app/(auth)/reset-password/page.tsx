import { type Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Diyafa account password.",
  robots: { index: false },
};

export { ResetPasswordPage as default } from "~/pageComponents/ResetPasswordPage/ResetPassword.page";
