import { zodResolver } from "@hookform/resolvers/zod";
import { isAuthError } from "@supabase/supabase-js";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { FormInput } from "~/components/FormInput/FormInput";
import { Button } from "~/components/ui/button";
import { Form, FormField } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { supabase } from "~/server/supabase/supabaseClient";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { Mail } from "lucide-react";
import {
  type RegisterFormValues,
  resetPasswordValidationSchema,
} from "./ResetPasswordForm.schema";

export function ResetPasswordForm() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(resetPasswordValidationSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await supabase().auth.resetPasswordForEmail(data.email, {
        redirectTo: `${getBaseUrl()}/dashboard/settings`,
      });
      toast({
        title: t("resetPassword.checkYourEmailToReset"),
        description: t("register.checkYourEmailForConfirmation"),
        variant: "topDescructive",
      });
    } catch (e) {
      if (isAuthError(e)) {
        toast({
          title: t("toastCommon.errorTitle"),
          description: e.message,
          variant: "topDescructive",
          duration: 9000,
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormInput label={t("common.emailLabel")}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  {...field}
                  autoComplete="email"
                  placeholder="you@restaurant.com"
                  className="h-11 rounded-lg border-border/60 bg-background pl-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </FormInput>
          )}
        />

        <Button
          className="mt-1 h-11 w-full rounded-lg bg-primary text-sm font-semibold shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
          loading={form.formState.isSubmitting}
          type="submit"
        >
          {t("resetPassword.resetButton")}
        </Button>
      </form>
    </Form>
  );
}
