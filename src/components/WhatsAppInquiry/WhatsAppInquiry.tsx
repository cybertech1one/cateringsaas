"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/utils/cn";
import {
  generateCateringInquiryLink,
  generateSimpleInquiryLink,
} from "~/utils/whatsapp";

// ── Types ────────────────────────────────────────────────────────

interface WhatsAppInquiryBaseProps {
  /** The caterer's WhatsApp number (E.164 or local Moroccan format) */
  orgPhone: string;
  /** Name of the catering organization */
  orgName: string;
  /** Optional event type to pre-fill in the message */
  eventType?: string;
  /** Optional guest count to pre-fill */
  guestCount?: number;
  /** Optional event date to pre-fill (display string) */
  eventDate?: string;
  /** Additional CSS class names */
  className?: string;
}

interface WhatsAppInquiryFullProps extends WhatsAppInquiryBaseProps {
  /** Render the full button with text (default) */
  variant?: "full";
}

interface WhatsAppInquiryIconProps extends WhatsAppInquiryBaseProps {
  /** Render a compact icon-only button */
  variant: "icon";
}

type WhatsAppInquiryProps = WhatsAppInquiryFullProps | WhatsAppInquiryIconProps;

// ── WhatsApp Brand Colors ────────────────────────────────────────

const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_GREEN_HOVER = "#1fb855";

// ── Component ────────────────────────────────────────────────────

/**
 * WhatsApp Inquiry Button
 *
 * Renders a WhatsApp-branded button that opens a conversation
 * with the caterer pre-filled with event details. Supports both
 * a full button with label and a compact icon-only variant.
 *
 * Usage:
 * ```tsx
 * <WhatsAppInquiry
 *   orgPhone="+212612345678"
 *   orgName="Dar Zellij Traiteur"
 *   eventType="Wedding"
 *   guestCount={200}
 *   eventDate="2026-06-15"
 * />
 *
 * <WhatsAppInquiry
 *   variant="icon"
 *   orgPhone="+212612345678"
 *   orgName="Dar Zellij Traiteur"
 * />
 * ```
 */
export function WhatsAppInquiry(props: WhatsAppInquiryProps) {
  const {
    orgPhone,
    orgName,
    eventType,
    guestCount,
    eventDate,
    className,
  } = props;

  const variant = props.variant ?? "full";

  // Build the WhatsApp link
  const hasEventDetails = eventType || guestCount || eventDate;

  const whatsappUrl = hasEventDetails
    ? generateCateringInquiryLink({
        phone: orgPhone,
        orgName,
        eventType,
        guestCount,
        eventDate,
      })
    : generateSimpleInquiryLink(orgPhone, orgName);

  if (variant === "icon") {
    return (
      <Button
        asChild
        size="icon"
        className={cn(
          "rounded-full text-white shadow-lg hover:shadow-xl transition-all",
          className,
        )}
        style={{
          backgroundColor: WHATSAPP_GREEN,
        }}
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Send WhatsApp inquiry to ${orgName}`}
          onMouseEnter={(e) => {
            (e.currentTarget.parentElement as HTMLElement | null)?.style.setProperty(
              "background-color",
              WHATSAPP_GREEN_HOVER,
            );
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.parentElement as HTMLElement | null)?.style.setProperty(
              "background-color",
              WHATSAPP_GREEN,
            );
          }}
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      </Button>
    );
  }

  return (
    <Button
      asChild
      className={cn(
        "gap-2 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all",
        className,
      )}
      style={{
        backgroundColor: WHATSAPP_GREEN,
      }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Send WhatsApp inquiry to ${orgName}`}
        onMouseEnter={(e) => {
          (e.currentTarget.parentElement as HTMLElement | null)?.style.setProperty(
            "background-color",
            WHATSAPP_GREEN_HOVER,
          );
        }}
        onMouseLeave={(e) => {
          (e.currentTarget.parentElement as HTMLElement | null)?.style.setProperty(
            "background-color",
            WHATSAPP_GREEN,
          );
        }}
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp Inquiry
      </a>
    </Button>
  );
}

export default WhatsAppInquiry;
