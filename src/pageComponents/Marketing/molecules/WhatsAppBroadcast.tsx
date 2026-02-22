"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import { MessageSquare, Send, Phone, Sparkles } from "lucide-react";
import { cn } from "~/utils/cn";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clean a phone number for use in WhatsApp deep links.
 * Removes spaces, dashes, and parentheses. Adds country code if missing.
 */
function cleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");

  // If it starts with 0, assume Moroccan number and replace with +212
  if (cleaned.startsWith("0")) {
    cleaned = "+212" + cleaned.slice(1);
  }

  // Remove + for wa.me format (they expect just digits)
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WhatsAppBroadcast() {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  const { data, isLoading } = api.marketing.getCustomerContacts.useQuery({});

  const templates = useMemo(
    () => [
      {
        key: "newItems" as const,
        label: t("marketing.whatsapp.templateNewItems"),
      },
      {
        key: "specialOffer" as const,
        label: t("marketing.whatsapp.templateSpecialOffer"),
      },
      {
        key: "missYou" as const,
        label: t("marketing.whatsapp.templateMissYou"),
      },
    ],
    [t],
  );

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-40" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state (no contacts)
  // ---------------------------------------------------------------------------

  if (!data || data.contacts.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">
          {t("marketing.whatsapp.title")}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t("marketing.whatsapp.noContacts")}
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Composer */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            {t("marketing.whatsapp.title")}
          </CardTitle>
          <CardDescription>
            {t("marketing.whatsapp.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message textarea */}
          <div>
            <label
              htmlFor="whatsapp-message"
              className="mb-1.5 block text-sm font-medium"
            >
              {t("marketing.whatsapp.messageLabel")}
            </label>
            <Textarea
              id="whatsapp-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("marketing.whatsapp.messagePlaceholder")}
              rows={5}
              className="resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("marketing.whatsapp.characterCount", {
                count: message.length,
              })}
            </p>
          </div>

          {/* Template buttons */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("marketing.whatsapp.templates")}
            </p>
            <div className="flex flex-wrap gap-2">
              {templates.map((tmpl) => (
                <Button
                  key={tmpl.key}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setMessage(tmpl.label)}
                >
                  {tmpl.label.length > 40
                    ? tmpl.label.slice(0, 40) + "..."
                    : tmpl.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {message && (
            <div>
              <p className="mb-2 text-sm font-medium">
                {t("marketing.whatsapp.preview")}
              </p>
              <div className="rounded-lg border border-border/50 bg-[#dcf8c6] p-3 dark:bg-[#025c4c]">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {message}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact list */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {t("marketing.contacts.title")}
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {data.totalCount}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[480px] space-y-2 overflow-y-auto">
            {data.contacts.map((contact) => {
              const whatsappUrl = `https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}?text=${encodeURIComponent(message)}`;

              return (
                <div
                  key={contact.phone}
                  className="flex items-center justify-between rounded-lg border border-border/30 p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {contact.name || t("marketing.contacts.anonymous")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contact.phone}
                    </p>
                  </div>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors",
                      message
                        ? "bg-[#25d366] hover:bg-[#1fb855]"
                        : "pointer-events-none bg-muted text-muted-foreground",
                    )}
                    aria-disabled={!message}
                  >
                    <Send className="h-3 w-3" />
                    {t("marketing.whatsapp.sendVia")}
                  </a>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
