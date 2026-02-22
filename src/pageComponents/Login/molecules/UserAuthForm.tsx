"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Provider } from "@supabase/supabase-js";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { FormInput } from "~/components/FormInput/FormInput";
import { Icons } from "~/components/Icons";
import { Button } from "~/components/ui/button";
import { Form, FormField } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { supabase } from "~/server/supabase/supabaseClient";
import { Mail, Lock } from "lucide-react";
import {
  type LoginFormValues,
  loginValidationSchema,
} from "./UserAuthForm.schema";

const signInWithOauth = (provider: Provider) => {
  void supabase().auth.signInWithOAuth({
    provider: provider,
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
};

export function UserAuthForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginValidationSchema(t)),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (data: LoginFormValues) => {
    const { error } = await supabase().auth.signInWithPassword(data);

    if (error) {
      toast({
        title: t("toastCommon.errorTitle"),
        description: error.message,
        variant: "destructive",
        duration: 9000,
      });

      return;
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
            <FormInput label={t("login.emailLabel")}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  {...field}
                  placeholder="you@restaurant.com"
                  className="h-11 rounded-lg border-border/60 bg-background pl-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </FormInput>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormInput label={t("login.passwordLabel")}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  {...field}
                  type="password"
                  placeholder={t("login.passwordPlaceholder")}
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
          {t("login.submitButton")}
        </Button>
      </form>

      {/* Separator */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground/60">
            {t("auth.orContinueWith")}
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border/60 bg-background text-sm font-medium shadow-sm transition-all duration-200 hover:border-border hover:bg-muted/50 hover:shadow-md"
        onClick={() => {
          signInWithOauth("google");
        }}
      >
        <Icons.google width={18} height={18} />
        <span className="text-foreground/80 transition-colors group-hover:text-foreground">
          {t("auth.continueWithGoogle")}
        </span>
      </button>
    </Form>
  );
}
