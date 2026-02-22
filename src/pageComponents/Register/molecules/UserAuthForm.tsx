"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAuthError, type Provider } from "@supabase/supabase-js";
import { type TFunction } from "i18next";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { FormInput } from "~/components/FormInput/FormInput";
import { Icons } from "~/components/Icons";
import { Button } from "~/components/ui/button";
import { Form, FormField } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { supabase } from "~/server/supabase/supabaseClient";
import { type ZodReturnType } from "~/utils";
import { Progress } from "~/components/ui/progress";
import { Mail, Lock, Check, X } from "lucide-react";

const registerValidationSchema = (translate: TFunction) =>
  z
    .object({
      email: z.string().email(),
      password: z
        .string()
        .min(8, translate("common.passwordLengthValidation"))
        .regex(/[A-Z]/, translate("common.passwordUppercaseValidation"))
        .regex(/[a-z]/, translate("common.passwordLowercaseValidation"))
        .regex(
          /[^A-Za-z0-9]/,
          translate("common.passwordSpecialCharacterValidation"),
        ),
      passwordConfirmation: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: translate("common.passwordConfirmationValidation"),
      path: ["passwordConfirmation"],
    });

type RegisterFormValues = ZodReturnType<typeof registerValidationSchema>;

const signInWithOauth = (provider: Provider) => {
  void supabase().auth.signInWithOAuth({
    provider: provider,
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
};

const translations = {
  en: {
    hello: "Hello",
    confirmYourEmailAddress: "Confirm your email address.",
    resetYourEmail: "Reset your email.",
    confirmYourEmailAddressDescription:
      "Please confirm your email address by clicking the button below.",
    resetYourEmailDescription:
      "Click the button below to reset your email address.",
    buttonText: "Continue",
    orCopyAndPaste: "or copy and paste this URL into your browser:",
  },
  fr: {
    hello: "Bonjour",
    confirmYourEmailAddress: "Confirmez votre adresse email.",
    resetYourEmail: "Réinitialisez votre email.",
    confirmYourEmailAddressDescription:
      "Veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.",
    resetYourEmailDescription:
      "Cliquez sur le bouton ci-dessous pour réinitialiser votre adresse email.",
    buttonText: "Continuer",
    orCopyAndPaste: "ou copiez et collez cette URL dans votre navigateur :",
  },
  ar: {
    hello: "مرحباً",
    confirmYourEmailAddress: "قم بتأكيد عنوان بريدك الإلكتروني.",
    resetYourEmail: "أعد تعيين بريدك الإلكتروني.",
    confirmYourEmailAddressDescription:
      "يرجى تأكيد عنوان بريدك الإلكتروني بالنقر على الزر أدناه.",
    resetYourEmailDescription:
      "انقر على الزر أدناه لإعادة تعيين عنوان بريدك الإلكتروني.",
    buttonText: "متابعة",
    orCopyAndPaste: "أو انسخ والصق هذا الرابط في متصفحك:",
  },
};

export function UserAuthForm() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerValidationSchema(t)),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const password = form.watch("password");
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const showStrengthMeter = passwordFocused || password.length > 0;

  const requirements = [
    { key: "common.passwordRequirementLength" as const, met: password.length >= 8 },
    { key: "common.passwordRequirementUppercase" as const, met: /[A-Z]/.test(password) },
    { key: "common.passwordRequirementLowercase" as const, met: /[a-z]/.test(password) },
    { key: "common.passwordRequirementSpecial" as const, met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = requirements.filter((r) => r.met).length;
  const strengthPercent = metCount * 25;
  const strengthLabel = (
    [
      t("common.passwordStrengthWeak"),
      t("common.passwordStrengthWeak"),
      t("common.passwordStrengthFair"),
      t("common.passwordStrengthGood"),
      t("common.passwordStrengthStrong"),
    ] as string[]
  )[metCount] as string;
  const strengthColor = ["bg-red-500", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"][metCount] as string;

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await supabase().auth.signUp({
        ...data,
        options: {
          data: translations[i18n.language as "en" | "fr" | "ar"] || translations.en,
        },
      });

      toast({
        title: t("register.checkYourEmailForConfirmation"),
        description: t("common.confirmYourEmail"),
        variant: "default",
        duration: 9000,
      });
    } catch (e) {
      if (isAuthError(e)) {
        toast({
          title: t("toastCommon.errorTitle"),
          description: e.message,
          variant: "destructive",
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
            <FormInput label={t("common.passwordLabel")}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  {...field}
                  type="password"
                  placeholder={t("register.passwordPlaceholder")}
                  className="h-11 rounded-lg border-border/60 bg-background pl-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground/40 focus-visible:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/20"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    field.onBlur();
                    setPasswordFocused(false);
                  }}
                />
              </div>
              {showStrengthMeter && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={strengthPercent}
                      className="h-1.5 flex-1"
                      indicatorClassName={strengthColor}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {strengthLabel}
                    </span>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {requirements.map((req) => (
                      <li
                        key={req.key}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        {req.met ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground/40" />
                        )}
                        <span
                          className={
                            req.met
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground/60"
                          }
                        >
                          {t(req.key)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </FormInput>
          )}
        />
        <FormField
          control={form.control}
          name="passwordConfirmation"
          render={({ field }) => (
            <FormInput label={t("common.passwordConfirmLabel")}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  {...field}
                  type="password"
                  placeholder={t("register.passwordConfirmPlaceholder")}
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
          {t("register.submitButton")}
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
