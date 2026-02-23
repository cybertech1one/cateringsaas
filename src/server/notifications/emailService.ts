/**
 * Diyafa Email Notification Service
 *
 * Uses Resend API via plain fetch() to send professional, bilingual
 * (French + Arabic) email notifications for the catering platform.
 *
 * If RESEND_API_KEY is not configured, all send functions gracefully
 * return { success: false, reason: "not_configured" } without throwing.
 *
 * NOTE: Reads env vars via process.env directly (not env.mjs)
 * to avoid triggering env validation at import time in tests.
 */
import { logger } from "~/server/logger";

// ── Constants ────────────────────────────────────

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Diyafa <noreply@diyafa.ma>";

// Brand colors
const EMBER = "#c2410c";
const EMBER_LIGHT = "#fed7aa";
const GOLD = "#b8860b";
const GOLD_LIGHT = "#fef3c7";
const TEXT_DARK = "#1c1917";
const TEXT_MUTED = "#78716c";
const BG_WARM = "#fffbeb";
const BORDER = "#e7e5e4";

// ── Types ────────────────────────────────────────

export interface InquiryEmailData {
  customerName: string;
  eventType: string;
  eventDate: Date;
  guestCount: number;
  venueName?: string;
  venueCity?: string;
  customerPhone: string;
  customerEmail?: string;
  specialRequests?: string;
  orgName: string;
}

export interface QuoteEmailData {
  customerName: string;
  eventType: string;
  eventDate: Date;
  guestCount: number;
  venueName?: string;
  quoteNumber: string;
  versionNumber: number;
  items: Array<{
    sectionName: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  totalAmount: number;
  pricePerPerson: number | null;
  validUntil: Date;
  notes?: string;
  orgName: string;
}

export interface PaymentEmailData {
  customerName: string;
  eventType: string;
  eventDate: Date;
  amount: number;
  paymentMethod: string;
  reference: string;
  orgName: string;
}

export interface MilestoneEmailData {
  customerName: string;
  eventType: string;
  eventDate: Date;
  milestoneName: string;
  amount: number;
  dueDate: Date;
  totalAmount: number;
  paidSoFar: number;
  orgName: string;
}

export interface EventConfirmationData {
  customerName: string;
  eventType: string;
  eventDate: Date;
  startTime?: string;
  endTime?: string;
  guestCount: number;
  venueName?: string;
  venueAddress?: string;
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
  orgName: string;
  orgPhone?: string;
}

type SendResult =
  | { success: true; emailId: string }
  | { success: false; reason: "not_configured" | "send_failed" };

// ── Configuration ────────────────────────────────

function getResendKey(): string | undefined {
  return process.env.RESEND_API_KEY || undefined;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM_ADDRESS || DEFAULT_FROM;
}

// ── MAD Currency Formatting ──────────────────────

/**
 * Format a number as Moroccan Dirham with space thousands separator.
 * e.g. 45000 -> "45 000 MAD"
 */
export function formatMAD(amount: number): string {
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} MAD`;
}

/**
 * Format a date as French locale string.
 */
function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Translate event type to French.
 */
function eventTypeFr(type: string): string {
  const map: Record<string, string> = {
    wedding: "Mariage",
    corporate: "Entreprise",
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
  return map[type] || type;
}

// ── HTML Email Generation ────────────────────────

/**
 * Generate a complete HTML email with Diyafa branding.
 * Uses table-based layout for maximum email client compatibility.
 */
export function generateEmailHtml(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_WARM};font-family:Arial,Helvetica,sans-serif;color:${TEXT_DARK};">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BG_WARM};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${EMBER}, ${GOLD});padding:32px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="text-align:center;">
                    <div style="font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:1px;">Diyafa</div>
                    <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:4px;">Plateforme de traiteur au Maroc</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Title Bar -->
          <tr>
            <td style="background-color:${EMBER_LIGHT};padding:16px 40px;border-bottom:2px solid ${GOLD};">
              <h1 style="margin:0;font-size:20px;color:${EMBER};font-weight:600;">${title}</h1>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafaf9;padding:24px 40px;border-top:1px solid ${BORDER};text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:${TEXT_MUTED};">
                Diyafa - Plateforme de traiteur au Maroc
              </p>
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};" dir="rtl">
                &#1590;&#1610;&#1575;&#1601;&#1577; - &#1605;&#1606;&#1589;&#1577; &#1582;&#1583;&#1605;&#1575;&#1578; &#1575;&#1604;&#1578;&#1605;&#1608;&#1610;&#1606; &#1601;&#1610; &#1575;&#1604;&#1605;&#1594;&#1585;&#1576;
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Shared HTML Components ───────────────────────

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;font-size:14px;color:${TEXT_MUTED};border-bottom:1px solid ${BORDER};width:40%;">${label}</td>
    <td style="padding:8px 12px;font-size:14px;color:${TEXT_DARK};font-weight:500;border-bottom:1px solid ${BORDER};">${value}</td>
  </tr>`;
}

function detailsTable(rows: Array<[string, string]>): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
    ${rows.map(([label, value]) => detailRow(label, value)).join("\n")}
  </table>`;
}

function arabicSection(text: string): string {
  return `<div style="margin-top:24px;padding:16px;background-color:${GOLD_LIGHT};border-radius:8px;border-right:4px solid ${GOLD};text-align:right;" dir="rtl">
    <p style="margin:0;font-size:14px;color:${TEXT_DARK};line-height:1.8;">${text}</p>
  </div>`;
}

// ── Core Send Function ───────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  const apiKey = getResendKey();

  if (!apiKey) {
    logger.info("Resend API key not configured, skipping email", "email");
    return { success: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(
        `Email send failed (${response.status}): ${errorText}`,
        undefined,
        "email",
      );
      return { success: false, reason: "send_failed" };
    }

    const data = (await response.json()) as { id: string };
    logger.info(`Email sent successfully: ${data.id}`, "email");
    return { success: true, emailId: data.id };
  } catch (error) {
    logger.error("Failed to send email", error, "email");
    return { success: false, reason: "send_failed" };
  }
}

// ── Template: Inquiry Confirmation (to client) ───

export async function sendInquiryConfirmation(
  to: string,
  data: InquiryEmailData,
): Promise<SendResult> {
  const subject = `Demande recue - ${eventTypeFr(data.eventType)} | Diyafa`;

  const body = `
    <p style="font-size:16px;line-height:1.6;color:${TEXT_DARK};">
      Bonjour <strong>${data.customerName}</strong>,
    </p>
    <p style="font-size:15px;line-height:1.6;color:${TEXT_DARK};">
      Votre demande a bien ete recue. L'equipe de <strong>${data.orgName}</strong> vous contactera prochainement.
    </p>
    ${detailsTable([
      ["Type d'evenement", eventTypeFr(data.eventType)],
      ["Date", formatDateFr(data.eventDate)],
      ["Nombre d'invites", String(data.guestCount)],
      ...(data.venueName ? [["Lieu", data.venueName] as [string, string]] : []),
      ...(data.venueCity ? [["Ville", data.venueCity] as [string, string]] : []),
      ...(data.specialRequests ? [["Demandes speciales", data.specialRequests] as [string, string]] : []),
    ])}
    ${arabicSection(
      `&#1605;&#1585;&#1581;&#1576;&#1575; <strong>${data.customerName}</strong>&#1548; &#1578;&#1605; &#1575;&#1587;&#1578;&#1604;&#1575;&#1605; &#1591;&#1604;&#1576;&#1603;&#1605; &#1576;&#1606;&#1580;&#1575;&#1581;. &#1587;&#1610;&#1578;&#1608;&#1575;&#1589;&#1604; &#1605;&#1593;&#1603;&#1605; &#1601;&#1585;&#1610;&#1602; <strong>${data.orgName}</strong> &#1602;&#1585;&#1610;&#1576;&#1575;.`
    )}
  `;

  return sendEmail(to, subject, generateEmailHtml("Votre demande a ete recue", body));
}

// ── Template: New Inquiry Alert (to caterer) ─────

export async function sendNewInquiryAlert(
  to: string,
  data: InquiryEmailData,
): Promise<SendResult> {
  const subject = `Nouvelle demande - ${data.customerName} (${eventTypeFr(data.eventType)}) | Diyafa`;

  const body = `
    <p style="font-size:16px;line-height:1.6;color:${TEXT_DARK};">
      Vous avez recu une nouvelle demande de renseignements.
    </p>
    ${detailsTable([
      ["Client", data.customerName],
      ["Telephone", data.customerPhone],
      ...(data.customerEmail ? [["Email", data.customerEmail] as [string, string]] : []),
      ["Type d'evenement", eventTypeFr(data.eventType)],
      ["Date", formatDateFr(data.eventDate)],
      ["Nombre d'invites", String(data.guestCount)],
      ...(data.venueName ? [["Lieu", data.venueName] as [string, string]] : []),
      ...(data.venueCity ? [["Ville", data.venueCity] as [string, string]] : []),
      ...(data.specialRequests ? [["Demandes speciales", data.specialRequests] as [string, string]] : []),
    ])}
    <p style="font-size:14px;color:${TEXT_MUTED};margin-top:16px;">
      Connectez-vous a votre tableau de bord Diyafa pour repondre a cette demande.
    </p>
  `;

  return sendEmail(to, subject, generateEmailHtml("Nouvelle demande recue", body));
}

// ── Template: Quote Email (to client) ────────────

export async function sendQuoteEmail(
  to: string,
  data: QuoteEmailData,
): Promise<SendResult> {
  const subject = `Devis ${data.quoteNumber} - ${eventTypeFr(data.eventType)} | ${data.orgName}`;

  // Group items by section
  const sections = new Map<string, typeof data.items>();
  for (const item of data.items) {
    const existing = sections.get(item.sectionName) || [];
    existing.push(item);
    sections.set(item.sectionName, existing);
  }

  let itemsHtml = "";
  for (const [sectionName, items] of sections) {
    itemsHtml += `
      <tr>
        <td colspan="4" style="padding:10px 12px;font-size:14px;font-weight:600;color:${EMBER};background-color:${EMBER_LIGHT};border-bottom:1px solid ${BORDER};">
          ${sectionName}
        </td>
      </tr>
    `;
    for (const item of items) {
      itemsHtml += `
        <tr>
          <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid ${BORDER};">${item.itemName}</td>
          <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid ${BORDER};text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid ${BORDER};text-align:right;">${formatMAD(item.unitPrice)}</td>
          <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid ${BORDER};text-align:right;font-weight:500;">${formatMAD(item.subtotal)}</td>
        </tr>
      `;
    }
  }

  const body = `
    <p style="font-size:16px;line-height:1.6;color:${TEXT_DARK};">
      Bonjour <strong>${data.customerName}</strong>,
    </p>
    <p style="font-size:15px;line-height:1.6;color:${TEXT_DARK};">
      Veuillez trouver ci-dessous votre devis pour l'evenement <strong>${eventTypeFr(data.eventType)}</strong>
      du <strong>${formatDateFr(data.eventDate)}</strong>.
    </p>

    <!-- Quote Details -->
    ${detailsTable([
      ["Reference", data.quoteNumber],
      ["Version", String(data.versionNumber)],
      ["Nombre d'invites", String(data.guestCount)],
      ...(data.venueName ? [["Lieu", data.venueName] as [string, string]] : []),
    ])}

    <!-- Line Items -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f5f5f4;">
        <th style="padding:10px 12px;font-size:13px;text-align:left;color:${TEXT_MUTED};border-bottom:2px solid ${BORDER};">Article</th>
        <th style="padding:10px 12px;font-size:13px;text-align:center;color:${TEXT_MUTED};border-bottom:2px solid ${BORDER};">Qte</th>
        <th style="padding:10px 12px;font-size:13px;text-align:right;color:${TEXT_MUTED};border-bottom:2px solid ${BORDER};">P.U.</th>
        <th style="padding:10px 12px;font-size:13px;text-align:right;color:${TEXT_MUTED};border-bottom:2px solid ${BORDER};">Total</th>
      </tr>
      ${itemsHtml}
    </table>

    <!-- Totals -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
      <tr>
        <td style="padding:6px 12px;font-size:14px;color:${TEXT_MUTED};text-align:right;">Sous-total</td>
        <td style="padding:6px 12px;font-size:14px;text-align:right;width:140px;">${formatMAD(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;font-size:14px;color:${TEXT_MUTED};text-align:right;">TVA (${data.tvaRate}%)</td>
        <td style="padding:6px 12px;font-size:14px;text-align:right;">${formatMAD(data.tvaAmount)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-size:18px;font-weight:700;color:${EMBER};text-align:right;border-top:2px solid ${GOLD};">Total TTC</td>
        <td style="padding:10px 12px;font-size:18px;font-weight:700;color:${EMBER};text-align:right;border-top:2px solid ${GOLD};">${formatMAD(data.totalAmount)}</td>
      </tr>
      ${data.pricePerPerson ? `
      <tr>
        <td style="padding:4px 12px;font-size:13px;color:${TEXT_MUTED};text-align:right;">Prix par personne</td>
        <td style="padding:4px 12px;font-size:13px;color:${TEXT_MUTED};text-align:right;">${formatMAD(data.pricePerPerson)}</td>
      </tr>
      ` : ""}
    </table>

    <!-- Validity -->
    <div style="margin:16px 0;padding:12px 16px;background-color:${GOLD_LIGHT};border-radius:8px;border-left:4px solid ${GOLD};">
      <p style="margin:0;font-size:13px;color:${TEXT_DARK};">
        <strong>Validite :</strong> Ce devis est valable jusqu'au <strong>${formatDateFr(data.validUntil)}</strong>.
      </p>
    </div>

    ${data.notes ? `
    <div style="margin:16px 0;">
      <p style="font-size:13px;color:${TEXT_MUTED};margin:0 0 4px;">Notes :</p>
      <p style="font-size:14px;color:${TEXT_DARK};margin:0;">${data.notes}</p>
    </div>
    ` : ""}

    ${arabicSection(
      `&#1575;&#1604;&#1587;&#1604;&#1575;&#1605; &#1593;&#1604;&#1610;&#1603;&#1605; <strong>${data.customerName}</strong>&#1548; &#1610;&#1585;&#1580;&#1609; &#1575;&#1604;&#1575;&#1591;&#1604;&#1575;&#1593; &#1593;&#1604;&#1609; &#1593;&#1585;&#1590; &#1575;&#1604;&#1575;&#1587;&#1593;&#1575;&#1585; &#1575;&#1604;&#1605;&#1585;&#1601;&#1602;. &#1575;&#1604;&#1605;&#1576;&#1604;&#1594; &#1575;&#1604;&#1573;&#1580;&#1605;&#1575;&#1604;&#1610;: <strong>${formatMAD(data.totalAmount)}</strong>`
    )}
  `;

  return sendEmail(to, subject, generateEmailHtml("Votre devis est pret", body));
}

// ── Template: Quote Accepted (to caterer) ────────

export async function sendQuoteAcceptedEmail(
  to: string,
  data: QuoteEmailData,
): Promise<SendResult> {
  const subject = `Devis accepte - ${data.customerName} (${data.quoteNumber}) | Diyafa`;

  const body = `
    <p style="font-size:16px;line-height:1.6;color:${TEXT_DARK};">
      Bonne nouvelle ! Le client a accepte votre devis.
    </p>
    ${detailsTable([
      ["Client", data.customerName],
      ["Evenement", eventTypeFr(data.eventType)],
      ["Date", formatDateFr(data.eventDate)],
      ["Reference devis", data.quoteNumber],
      ["Montant total", formatMAD(data.totalAmount)],
      ["Nombre d'invites", String(data.guestCount)],
    ])}
    <div style="margin:20px 0;padding:16px;background-color:#dcfce7;border-radius:8px;border-left:4px solid #16a34a;text-align:center;">
      <p style="margin:0;font-size:16px;font-weight:600;color:#15803d;">
        Devis accepte - ${formatMAD(data.totalAmount)}
      </p>
    </div>
    <p style="font-size:14px;color:${TEXT_MUTED};">
      Prochaine etape : envoyez les instructions de paiement au client.
    </p>
  `;

  return sendEmail(to, subject, generateEmailHtml("Devis accepte !", body));
}

// ── Template: Payment Confirmation (to client) ───

export async function sendPaymentConfirmation(
  to: string,
  data: PaymentEmailData,
): Promise<SendResult> {
  const subject = `Paiement recu - ${data.reference} | Diyafa`;

  const paymentMethodFr: Record<string, string> = {
    bank_transfer: "Virement bancaire",
    cash: "Especes",
    check: "Cheque",
    card: "Carte bancaire",
    cmi: "CMI",
    mobile: "Paiement mobile",
  };

  const body = `
    <p style="font-size:16px;line-height:1.6;color:${TEXT_DARK};">
      Bonjour <strong>${data.customerName}</strong>,
    </p>
    <p style="font-size:15px;line-height:1.6;color:${TEXT_DARK};">
      Nous confirmons la reception de votre paiement.
    </p>
    ${detailsTable([
      ["Reference", data.reference],
      ["Montant", formatMAD(data.amount)],
      ["Mode de paiement", paymentMethodFr[data.paymentMethod] || data.paymentMethod],
      ["Evenement", eventTypeFr(data.eventType)],
      ["Date evenement", formatDateFr(data.eventDate)],
    ])}
    <div style="margin:20px 0;padding:16px;background-color:#dcfce7;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#15803d;">
        ${formatMAD(data.amount)}
      </p>
      <p style="margin:4px 0 0;font-size:13px;color:#16a34a;">Paiement confirme</p>
    </div>
    ${arabicSection(
      `&#1578;&#1605; &#1575;&#1587;&#1578;&#1604;&#1575;&#1605; &#1583;&#1601;&#1593;&#1578;&#1603;&#1605; &#1576;&#1606;&#1580;&#1575;&#1581;. &#1575;&#1604;&#1605;&#1576;&#1604;&#1594;: <strong>${formatMAD(data.amount)}</strong> - &#1575;&#1604;&#1605;&#1585;&#1580;&#1593;: <strong>${data.reference}</strong>`
    )}
  `;

  return sendEmail(to, subject, generateEmailHtml("Paiement recu", body));
}

// ── Template: Payment Reminder (to client) ───────

export async function sendPaymentReminder(
  to: string,
  data: MilestoneEmailData,
): Promise<SendResult> {
  const subject = `Rappel de paiement - ${data.milestoneName} | Diyafa`;

  const remaining = data.totalAmount - data.paidSoFar;

  const body = `
    <p style="font-size:16px;line-height:1.6;color:${TEXT_DARK};">
      Bonjour <strong>${data.customerName}</strong>,
    </p>
    <p style="font-size:15px;line-height:1.6;color:${TEXT_DARK};">
      Nous vous rappelons qu'un paiement est attendu prochainement pour votre evenement.
    </p>
    ${detailsTable([
      ["Echeance", data.milestoneName],
      ["Montant du", formatMAD(data.amount)],
      ["Date d'echeance", formatDateFr(data.dueDate)],
      ["Evenement", eventTypeFr(data.eventType)],
      ["Date evenement", formatDateFr(data.eventDate)],
      ["Total evenement", formatMAD(data.totalAmount)],
      ["Deja paye", formatMAD(data.paidSoFar)],
      ["Reste a payer", formatMAD(remaining)],
    ])}
    <div style="margin:20px 0;padding:16px;background-color:${GOLD_LIGHT};border-radius:8px;border-left:4px solid ${GOLD};text-align:center;">
      <p style="margin:0;font-size:18px;font-weight:700;color:${GOLD};">
        ${formatMAD(data.amount)}
      </p>
      <p style="margin:4px 0 0;font-size:13px;color:${TEXT_MUTED};">
        Echeance : ${formatDateFr(data.dueDate)}
      </p>
    </div>
    ${arabicSection(
      `&#1578;&#1584;&#1603;&#1610;&#1585; &#1576;&#1575;&#1604;&#1583;&#1601;&#1593;: <strong>${data.milestoneName}</strong> - &#1575;&#1604;&#1605;&#1576;&#1604;&#1594;: <strong>${formatMAD(data.amount)}</strong>`
    )}
  `;

  return sendEmail(to, subject, generateEmailHtml("Rappel de paiement", body));
}

// ── Template: Event Confirmation (to client) ─────

export async function sendEventConfirmation(
  to: string,
  data: EventConfirmationData,
): Promise<SendResult> {
  const subject = `Evenement confirme - ${eventTypeFr(data.eventType)} | ${data.orgName}`;

  const body = `
    <p style="font-size:16px;line-height:1.6;color:${TEXT_DARK};">
      Bonjour <strong>${data.customerName}</strong>,
    </p>
    <p style="font-size:15px;line-height:1.6;color:${TEXT_DARK};">
      Votre evenement est officiellement confirme. Voici le recapitulatif :
    </p>
    ${detailsTable([
      ["Evenement", eventTypeFr(data.eventType)],
      ["Date", formatDateFr(data.eventDate)],
      ...(data.startTime ? [["Heure de debut", data.startTime] as [string, string]] : []),
      ...(data.endTime ? [["Heure de fin", data.endTime] as [string, string]] : []),
      ["Nombre d'invites", String(data.guestCount)],
      ...(data.venueName ? [["Lieu", data.venueName] as [string, string]] : []),
      ...(data.venueAddress ? [["Adresse", data.venueAddress] as [string, string]] : []),
    ])}

    <!-- Financial Summary -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:12px;font-size:14px;color:${TEXT_MUTED};border-bottom:1px solid ${BORDER};width:50%;">Montant total</td>
        <td style="padding:12px;font-size:14px;font-weight:600;border-bottom:1px solid ${BORDER};text-align:right;">${formatMAD(data.totalAmount)}</td>
      </tr>
      <tr>
        <td style="padding:12px;font-size:14px;color:#16a34a;border-bottom:1px solid ${BORDER};">Acompte paye</td>
        <td style="padding:12px;font-size:14px;font-weight:500;color:#16a34a;border-bottom:1px solid ${BORDER};text-align:right;">${formatMAD(data.depositPaid)}</td>
      </tr>
      <tr>
        <td style="padding:12px;font-size:14px;color:${EMBER};font-weight:600;">Reste a payer</td>
        <td style="padding:12px;font-size:16px;font-weight:700;color:${EMBER};text-align:right;">${formatMAD(data.balanceDue)}</td>
      </tr>
    </table>

    <!-- Caterer Contact -->
    <div style="margin:20px 0;padding:16px;background-color:${EMBER_LIGHT};border-radius:8px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${EMBER};">Votre traiteur</p>
      <p style="margin:0;font-size:14px;color:${TEXT_DARK};">${data.orgName}</p>
      ${data.orgPhone ? `<p style="margin:4px 0 0;font-size:14px;color:${TEXT_DARK};">${data.orgPhone}</p>` : ""}
    </div>

    ${arabicSection(
      `&#1578;&#1605; &#1578;&#1571;&#1603;&#1610;&#1583; &#1581;&#1583;&#1579;&#1603;&#1605;. &#1575;&#1604;&#1605;&#1576;&#1604;&#1594; &#1575;&#1604;&#1573;&#1580;&#1605;&#1575;&#1604;&#1610;: <strong>${formatMAD(data.totalAmount)}</strong>. &#1575;&#1604;&#1605;&#1578;&#1576;&#1602;&#1610;: <strong>${formatMAD(data.balanceDue)}</strong>`
    )}
  `;

  return sendEmail(to, subject, generateEmailHtml("Evenement confirme", body));
}
