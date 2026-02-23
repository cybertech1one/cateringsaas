/**
 * Diyafa Unified Notification System
 *
 * Sends both WhatsApp AND email for important events.
 * All calls are fire-and-forget (non-blocking).
 */
export {
  notifyOnInquiry,
  notifyOnQuoteSent,
  notifyOnQuoteAccepted,
  notifyOnPaymentReceived,
  notifyOnEventConfirmed,
  notifyOnPaymentReminder,
} from "./dispatcher";

export {
  sendInquiryConfirmation,
  sendNewInquiryAlert,
  sendQuoteEmail,
  sendQuoteAcceptedEmail,
  sendPaymentConfirmation,
  sendPaymentReminder,
  sendEventConfirmation,
  formatMAD,
  type InquiryEmailData,
  type QuoteEmailData,
  type PaymentEmailData,
  type MilestoneEmailData,
  type EventConfirmationData,
} from "./emailService";
