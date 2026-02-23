/**
 * Diyafa -- Quote PDF Data Types
 *
 * Types used by the QuotePDF printable component.
 * All monetary amounts are in centimes (integer).
 * Display currency is MAD (Moroccan Dirham).
 */

export interface QuotePDFOrg {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
}

export interface QuotePDFClient {
  name: string;
  phone?: string;
  email?: string;
}

export interface QuotePDFEvent {
  title: string;
  type: string;
  date: string;
  venue?: string;
  guestCount: number;
}

export interface QuotePDFLineItem {
  /** Description of the item/service */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit price in centimes */
  unitPrice: number;
  /** Line total in centimes (quantity * unitPrice) */
  total: number;
}

export interface QuotePDFData {
  /** Quote reference number (e.g. "DEV-2026-0042") */
  quoteNumber: string;
  /** Version number of this quote */
  version: number;
  /** ISO date string of when the quote was created */
  createdAt: string;
  /** ISO date string of when the quote expires */
  validUntil: string;
  /** Organization/caterer details */
  org: QuotePDFOrg;
  /** Client details */
  client: QuotePDFClient;
  /** Event details */
  event: QuotePDFEvent;
  /** Line items */
  lineItems: QuotePDFLineItem[];
  /** Subtotal in centimes (sum of all line items) */
  subtotal: number;
  /** TVA rate as a percentage (e.g. 20 for 20%) */
  tvaRate: number;
  /** TVA amount in centimes */
  tvaAmount: number;
  /** Grand total in centimes (subtotal + TVA) */
  total: number;
  /** Optional notes or special instructions */
  notes?: string;
  /** Payment terms and conditions */
  paymentTerms?: string;
}
