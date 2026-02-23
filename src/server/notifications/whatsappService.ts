/**
 * Diyafa -- WhatsApp Business API Integration
 *
 * Sends automated notifications via Meta's WhatsApp Business Cloud API.
 * All messages are bilingual: French (primary) + Arabic (secondary),
 * reflecting Morocco's business communication norms.
 *
 * Supports: WhatsApp Business Cloud API (Meta Graph API v21.0)
 *
 * Configuration (env vars, all optional for dev):
 *   WHATSAPP_API_TOKEN        - Meta Business permanent token
 *   WHATSAPP_PHONE_NUMBER_ID  - WhatsApp Business phone number ID
 *   WHATSAPP_VERIFY_TOKEN     - Webhook verification token
 *
 * When not configured, all functions log a warning and return false.
 * This ensures the main business logic never breaks due to WhatsApp.
 *
 * NOTE: This module reads env vars via process.env directly (not env.mjs)
 * to avoid triggering env validation at import time in test environments.
 */
import { logger } from "~/server/logger";
import { normalizePhoneForWhatsApp } from "~/utils/whatsapp";

// ── Constants ────────────────────────────────────────

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ── Types ────────────────────────────────────────────

export interface NewInquiryDetails {
  customerName: string;
  eventType: string;
  guestCount: number;
  eventDate: Date | string;
  customerPhone?: string;
  venueName?: string;
  venueCity?: string;
}

export interface InquiryConfirmationDetails {
  orgName: string;
  eventType: string;
  eventDate: Date | string;
}

export interface QuoteSentDetails {
  orgName: string;
  totalAmount: number;
  guestCount: number;
  eventTitle: string;
  quoteLink: string;
}

export interface QuoteAcceptedDetails {
  customerName: string;
  eventTitle: string;
  totalAmount: number;
}

export interface PaymentReceivedDetails {
  customerName: string;
  eventTitle: string;
  amount: number;
  milestoneLabel: string;
  paymentMethod: string;
}

export interface PaymentReminderDetails {
  orgName: string;
  eventTitle: string;
  amount: number;
  milestoneLabel: string;
  dueDate: Date | string;
}

export interface EventConfirmedDetails {
  orgName: string;
  eventTitle: string;
  eventDate: Date | string;
  venueName?: string;
  guestCount: number;
}

// ── Helpers ──────────────────────────────────────────

/**
 * Format an amount as Moroccan Dirham with space-separated thousands.
 * e.g. 45000 -> "45 000 MAD"
 */
export function formatMAD(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} MAD`;
}

/**
 * Format a date for display in messages (French locale).
 * Returns format like "15 juin 2026"
 */
export function formatEventDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  });
}

/**
 * Translate event types to French display names.
 */
function eventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    wedding: "Mariage",
    corporate: "Corporate",
    ramadan_iftar: "Iftar Ramadan",
    eid: "Eid",
    birthday: "Anniversaire",
    conference: "Conference",
    funeral: "Funerailles",
    engagement: "Fiancailles",
    henna: "Henna",
    graduation: "Remise de diplomes",
    diffa: "Diffa",
    other: "Autre",
  };
  return labels[eventType] ?? eventType.replace(/_/g, " ");
}

/**
 * Translate payment methods to French display names.
 */
function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cod: "Especes",
    cash: "Especes",
    bank_transfer: "Virement bancaire",
    cmi: "Carte bancaire (CMI)",
    check: "Cheque",
    mobile_money: "Mobile Money",
  };
  return labels[method] ?? method;
}

// ── Configuration ────────────────────────────────────

/**
 * Check if WhatsApp Business API credentials are configured.
 */
export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_API_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

/**
 * Get WhatsApp API credentials (reads from process.env lazily).
 */
function getConfig(): { token: string; phoneNumberId: string } | null {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return null;
  }

  return { token, phoneNumberId };
}

// ── Core Sender ──────────────────────────────────────

/**
 * Send a WhatsApp text message via the Meta Cloud API.
 *
 * Returns true if the message was sent successfully, false otherwise.
 * Never throws -- all errors are caught, logged, and swallowed.
 */
async function sendWhatsAppMessage(
  recipientPhone: string,
  messageText: string,
): Promise<boolean> {
  const config = getConfig();

  if (!config) {
    logger.warn(
      "WhatsApp not configured -- skipping notification. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
      undefined,
      "whatsapp",
    );
    return false;
  }

  try {
    const normalizedPhone = normalizePhoneForWhatsApp(recipientPhone);
    const url = `${GRAPH_API_BASE}/${config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedPhone,
        type: "text",
        text: {
          preview_url: true,
          body: messageText,
        },
      }),
    });

    if (response.ok) {
      logger.info(
        `WhatsApp message sent to ${normalizedPhone.slice(0, 6)}...`,
        "whatsapp",
      );
      return true;
    }

    const errorText = await response.text();
    logger.error(
      `WhatsApp API error (${response.status}): ${errorText}`,
      undefined,
      "whatsapp",
    );
    return false;
  } catch (error) {
    logger.error("Failed to send WhatsApp message", error, "whatsapp");
    return false;
  }
}

// ── Notification Functions ───────────────────────────

/**
 * Notify the caterer about a new inquiry.
 * Sent to the organization's WhatsApp number.
 */
export async function notifyNewInquiry(
  orgPhone: string,
  details: NewInquiryDetails,
): Promise<boolean> {
  const dateStr = formatEventDate(details.eventDate);
  const typeLabel = eventTypeLabel(details.eventType);
  const venue = details.venueName ? `\nLieu: ${details.venueName}` : "";
  const city = details.venueCity ? ` (${details.venueCity})` : "";
  const clientPhone = details.customerPhone
    ? `\nTel: ${details.customerPhone}`
    : "";

  const message = [
    `*Nouvelle demande Diyafa*`,
    ``,
    `Client: ${details.customerName}${clientPhone}`,
    `Type: ${typeLabel}`,
    `Date: ${dateStr}`,
    `Invites: ${details.guestCount}${venue}${city}`,
    ``,
    `Connectez-vous pour consulter les details et preparer un devis.`,
    ``,
    `---`,
    `طلب جديد - ${details.customerName}`,
    `${details.guestCount} ضيف | ${dateStr}`,
  ].join("\n");

  return sendWhatsAppMessage(orgPhone, message);
}

/**
 * Send an inquiry confirmation to the client.
 */
export async function confirmInquiryToClient(
  clientPhone: string,
  details: InquiryConfirmationDetails,
): Promise<boolean> {
  const dateStr = formatEventDate(details.eventDate);
  const typeLabel = eventTypeLabel(details.eventType);

  const message = [
    `*${details.orgName} - Confirmation*`,
    ``,
    `Merci pour votre demande !`,
    ``,
    `Votre demande pour un evenement de type *${typeLabel}* le *${dateStr}* a bien ete recue.`,
    `Notre equipe vous contactera dans les plus brefs delais avec un devis personnalise.`,
    ``,
    `---`,
    `شكرا لطلبكم! تم استلام طلبكم بنجاح.`,
    `سنتواصل معكم قريبا.`,
  ].join("\n");

  return sendWhatsAppMessage(clientPhone, message);
}

/**
 * Notify the client that a quote is ready.
 */
export async function notifyQuoteSent(
  clientPhone: string,
  details: QuoteSentDetails,
): Promise<boolean> {
  const amountStr = formatMAD(details.totalAmount);
  const pricePerPerson = details.guestCount > 0
    ? formatMAD(Math.round(details.totalAmount / details.guestCount))
    : null;

  const ppLine = pricePerPerson ? `\nPrix par personne: ${pricePerPerson}` : "";

  const message = [
    `*${details.orgName} - Devis pret*`,
    ``,
    `Votre devis pour *${details.eventTitle}* est pret !`,
    ``,
    `Montant total: *${amountStr}*${ppLine}`,
    `Invites: ${details.guestCount}`,
    ``,
    `Consultez votre devis:`,
    details.quoteLink,
    ``,
    `---`,
    `عرض السعر جاهز - ${amountStr}`,
    `${details.guestCount} ضيف`,
  ].join("\n");

  return sendWhatsAppMessage(clientPhone, message);
}

/**
 * Notify the caterer that a quote was accepted.
 */
export async function notifyQuoteAccepted(
  orgPhone: string,
  details: QuoteAcceptedDetails,
): Promise<boolean> {
  const amountStr = formatMAD(details.totalAmount);

  const message = [
    `*Devis accepte !*`,
    ``,
    `Le client *${details.customerName}* a accepte le devis pour *${details.eventTitle}*.`,
    ``,
    `Montant: *${amountStr}*`,
    ``,
    `Connectez-vous pour creer un echeancier de paiement.`,
    ``,
    `---`,
    `تم قبول عرض السعر - ${details.customerName}`,
    `${amountStr}`,
  ].join("\n");

  return sendWhatsAppMessage(orgPhone, message);
}

/**
 * Notify the caterer that a payment was received.
 */
export async function notifyPaymentReceived(
  orgPhone: string,
  details: PaymentReceivedDetails,
): Promise<boolean> {
  const amountStr = formatMAD(details.amount);
  const methodLabel = paymentMethodLabel(details.paymentMethod);

  const message = [
    `*Paiement recu*`,
    ``,
    `Client: ${details.customerName}`,
    `Evenement: ${details.eventTitle}`,
    ``,
    `Montant: *${amountStr}*`,
    `Echeance: ${details.milestoneLabel}`,
    `Methode: ${methodLabel}`,
    ``,
    `---`,
    `تم استلام الدفعة - ${amountStr}`,
    `${details.milestoneLabel}`,
  ].join("\n");

  return sendWhatsAppMessage(orgPhone, message);
}

/**
 * Send a payment reminder to the client.
 */
export async function sendPaymentReminder(
  clientPhone: string,
  details: PaymentReminderDetails,
): Promise<boolean> {
  const amountStr = formatMAD(details.amount);
  const dateStr = formatEventDate(details.dueDate);

  const message = [
    `*${details.orgName} - Rappel de paiement*`,
    ``,
    `Evenement: ${details.eventTitle}`,
    ``,
    `Echeance: *${details.milestoneLabel}*`,
    `Montant: *${amountStr}*`,
    `Date limite: *${dateStr}*`,
    ``,
    `Merci de proceder au reglement dans les delais.`,
    ``,
    `---`,
    `تذكير بالدفع - ${amountStr}`,
    `${details.milestoneLabel} | ${dateStr}`,
  ].join("\n");

  return sendWhatsAppMessage(clientPhone, message);
}

/**
 * Confirm event to the client after deposit/confirmation.
 */
export async function notifyEventConfirmed(
  clientPhone: string,
  details: EventConfirmedDetails,
): Promise<boolean> {
  const dateStr = formatEventDate(details.eventDate);
  const venueLine = details.venueName
    ? `\nLieu: ${details.venueName}`
    : "";

  const message = [
    `*${details.orgName} - Evenement confirme !*`,
    ``,
    `Votre evenement *${details.eventTitle}* est confirme !`,
    ``,
    `Date: *${dateStr}*${venueLine}`,
    `Invites: ${details.guestCount}`,
    ``,
    `Notre equipe se prepare pour vous offrir une experience exceptionnelle.`,
    ``,
    `---`,
    `تم تاكيد الحدث - ${dateStr}`,
    `${details.guestCount} ضيف`,
  ].join("\n");

  return sendWhatsAppMessage(clientPhone, message);
}
