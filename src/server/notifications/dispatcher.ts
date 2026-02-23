/**
 * Diyafa Unified Notification Dispatcher
 *
 * Sends notifications via multiple channels (WhatsApp + Email)
 * in parallel. All methods are fire-and-forget: they never throw,
 * and work even when one or more channels are not configured.
 */
import { logger } from "~/server/logger";
import {
  sendInquiryConfirmation,
  sendNewInquiryAlert,
  sendQuoteEmail,
  sendQuoteAcceptedEmail,
  sendPaymentConfirmation,
  sendPaymentReminder,
  sendEventConfirmation,
  type InquiryEmailData,
  type QuoteEmailData,
  type PaymentEmailData,
  type MilestoneEmailData,
  type EventConfirmationData,
} from "./emailService";

// ── Types ────────────────────────────────────────

interface InquiryNotification {
  clientEmail?: string;
  catererEmail?: string;
  inquiryData: InquiryEmailData;
}

interface QuoteNotification {
  clientEmail?: string;
  quoteData: QuoteEmailData;
}

interface QuoteAcceptedNotification {
  catererEmail?: string;
  quoteData: QuoteEmailData;
}

interface PaymentNotification {
  clientEmail?: string;
  catererEmail?: string;
  paymentData: PaymentEmailData;
}

interface EventConfirmedNotification {
  clientEmail?: string;
  eventData: EventConfirmationData;
}

interface MilestoneNotification {
  clientEmail?: string;
  milestoneData: MilestoneEmailData;
}

// ── Helpers ──────────────────────────────────────

/**
 * Fire-and-forget wrapper: executes the promise but catches all errors.
 */
async function safeDispatch(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logger.error(`Notification dispatch failed [${label}]`, error, "notifications");
  }
}

// ── Dispatch Methods ─────────────────────────────

/**
 * Notify both parties when a new inquiry is submitted.
 * - Client: email confirmation
 * - Caterer: email alert
 * - WhatsApp: TODO (integrate when WhatsApp service is ready)
 */
export async function notifyOnInquiry(data: InquiryNotification): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (data.clientEmail) {
    tasks.push(
      safeDispatch("inquiry-client-email", () =>
        sendInquiryConfirmation(data.clientEmail!, data.inquiryData)
      )
    );
  }

  if (data.catererEmail) {
    tasks.push(
      safeDispatch("inquiry-caterer-email", () =>
        sendNewInquiryAlert(data.catererEmail!, data.inquiryData)
      )
    );
  }

  // TODO: WhatsApp notification to caterer
  // tasks.push(safeDispatch("inquiry-caterer-whatsapp", () => sendWhatsApp(...)));

  await Promise.allSettled(tasks);
  logger.info(
    `Inquiry notifications dispatched (${tasks.length} channels)`,
    "notifications",
  );
}

/**
 * Notify client when a quote is sent.
 */
export async function notifyOnQuoteSent(data: QuoteNotification): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (data.clientEmail) {
    tasks.push(
      safeDispatch("quote-client-email", () =>
        sendQuoteEmail(data.clientEmail!, data.quoteData)
      )
    );
  }

  // TODO: WhatsApp notification with quote link

  await Promise.allSettled(tasks);
  logger.info(
    `Quote sent notifications dispatched (${tasks.length} channels)`,
    "notifications",
  );
}

/**
 * Notify caterer when a quote is accepted.
 */
export async function notifyOnQuoteAccepted(data: QuoteAcceptedNotification): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (data.catererEmail) {
    tasks.push(
      safeDispatch("quote-accepted-caterer-email", () =>
        sendQuoteAcceptedEmail(data.catererEmail!, data.quoteData)
      )
    );
  }

  // TODO: WhatsApp notification to caterer

  await Promise.allSettled(tasks);
  logger.info(
    `Quote accepted notifications dispatched (${tasks.length} channels)`,
    "notifications",
  );
}

/**
 * Notify both parties on payment received.
 */
export async function notifyOnPaymentReceived(data: PaymentNotification): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (data.clientEmail) {
    tasks.push(
      safeDispatch("payment-client-email", () =>
        sendPaymentConfirmation(data.clientEmail!, data.paymentData)
      )
    );
  }

  // Caterer notification is informational (no specific template yet)
  // Could add a sendPaymentReceivedAlert template later

  // TODO: WhatsApp notification to both

  await Promise.allSettled(tasks);
  logger.info(
    `Payment notifications dispatched (${tasks.length} channels)`,
    "notifications",
  );
}

/**
 * Notify client when their event is confirmed.
 */
export async function notifyOnEventConfirmed(data: EventConfirmedNotification): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (data.clientEmail) {
    tasks.push(
      safeDispatch("event-confirmed-client-email", () =>
        sendEventConfirmation(data.clientEmail!, data.eventData)
      )
    );
  }

  // TODO: WhatsApp confirmation to client

  await Promise.allSettled(tasks);
  logger.info(
    `Event confirmed notifications dispatched (${tasks.length} channels)`,
    "notifications",
  );
}

/**
 * Notify client about upcoming payment milestone.
 */
export async function notifyOnPaymentReminder(data: MilestoneNotification): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (data.clientEmail) {
    tasks.push(
      safeDispatch("payment-reminder-email", () =>
        sendPaymentReminder(data.clientEmail!, data.milestoneData)
      )
    );
  }

  // TODO: WhatsApp reminder

  await Promise.allSettled(tasks);
  logger.info(
    `Payment reminder notifications dispatched (${tasks.length} channels)`,
    "notifications",
  );
}
