/**
 * Moroccan Payments — CMI Gateway, Mobile Wallets, Tax & RIB Validation
 *
 * Morocco-specific payment processing: CMI (Centre Monétique Interbancaire),
 * mobile wallet providers, tax calculations, bank account (RIB) validation.
 *
 * ZERO external dependencies. Pure functions only.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MobileWalletProvider =
  | "inwi_money"
  | "orange_money"
  | "wafacash"
  | "cashplus"
  | "barid_bank";

export type BankCode =
  | "ATTIJARIWAFA"
  | "BMCE"
  | "BCP"
  | "SOCIETE_GENERALE"
  | "BMCI"
  | "CDM"
  | "CIH"
  | "AL_BARID"
  | "CFG"
  | "OTHER";

export interface CMIPaymentRequest {
  merchantId: string;
  amount: number;
  currency: "MAD";
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  failUrl: string;
  language: "fr" | "ar" | "en";
}

export interface CMIPaymentResponse {
  transactionId: string;
  status: "approved" | "declined" | "pending" | "error";
  authorizationCode: string;
  amount: number;
  message: string;
}

export interface MobileWalletPayment {
  provider: MobileWalletProvider;
  phoneNumber: string;
  amount: number;
  reference: string;
  status: "initiated" | "pending" | "completed" | "failed";
}

export interface RIBValidation {
  isValid: boolean;
  bankCode: string;
  branchCode: string;
  accountNumber: string;
  ribKey: string;
  bankName: string;
  errors: string[];
}

export interface TaxCalculation {
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  communalTax: number;
  communalTaxRate: number;
  totalWithTax: number;
  currency: string;
}

export interface PaymentMethodAvailability {
  cod: boolean;
  card: boolean;
  mobileWallet: boolean;
  bankTransfer: boolean;
  availableWallets: MobileWalletProvider[];
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  method: "original" | "wallet_credit" | "bank_transfer";
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VAT_RATE = 0.2; // Morocco standard VAT
const COMMUNAL_TAX_RATE = 0.0; // Delivery services typically exempt
const MAX_COD_AMOUNT = 500000; // 5,000 MAD in centimes
const MIN_CARD_AMOUNT = 1000; // 10 MAD in centimes

const BANK_CODES: Record<string, string> = {
  "011": "BMCE Bank of Africa",
  "013": "BMCI",
  "021": "CDM (Crédit du Maroc)",
  "007": "Attijariwafa Bank",
  "145": "Banque Populaire",
  "022": "Société Générale Maroc",
  "230": "CIH Bank",
  "020": "CFG Bank",
  "160": "Al Barid Bank",
};

const MOBILE_WALLET_CONFIG: Record<
  MobileWalletProvider,
  { name: string; maxAmount: number; minAmount: number }
> = {
  inwi_money: { name: "inwi money", maxAmount: 500000, minAmount: 100 },
  orange_money: { name: "Orange Money", maxAmount: 500000, minAmount: 100 },
  wafacash: { name: "Wafacash", maxAmount: 1000000, minAmount: 500 },
  cashplus: { name: "Cash Plus", maxAmount: 800000, minAmount: 200 },
  barid_bank: { name: "Barid Bank Mobile", maxAmount: 500000, minAmount: 100 },
};

// ---------------------------------------------------------------------------
// CMI Gateway Helpers
// ---------------------------------------------------------------------------

/**
 * Prepare a CMI payment request with required fields.
 */
export function prepareCMIPayment(
  merchantId: string,
  orderId: string,
  amountCentimes: number,
  customerEmail: string,
  customerPhone: string,
  returnUrl: string,
  failUrl: string,
  language: "fr" | "ar" | "en" = "fr",
): CMIPaymentRequest {
  return {
    merchantId,
    amount: amountCentimes,
    currency: "MAD",
    orderId,
    customerEmail,
    customerPhone: normalizePhoneNumber(customerPhone),
    returnUrl,
    failUrl,
    language,
  };
}

/**
 * Validate a CMI callback response.
 */
export function validateCMIResponse(
  response: CMIPaymentResponse,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!response.transactionId) {
    errors.push("Missing transaction ID");
  }

  if (!["approved", "declined", "pending", "error"].includes(response.status)) {
    errors.push(`Invalid status: ${response.status}`);
  }

  if (response.amount <= 0) {
    errors.push("Invalid amount");
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Mobile Wallet
// ---------------------------------------------------------------------------

/**
 * Validate a mobile wallet payment request.
 */
export function validateMobileWalletPayment(
  provider: MobileWalletProvider,
  phoneNumber: string,
  amountCentimes: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = MOBILE_WALLET_CONFIG[provider];

  if (!config) {
    errors.push(`Unknown wallet provider: ${provider}`);
    return { valid: false, errors };
  }

  if (amountCentimes < config.minAmount) {
    errors.push(
      `Amount ${amountCentimes} below minimum ${config.minAmount} for ${config.name}`,
    );
  }

  if (amountCentimes > config.maxAmount) {
    errors.push(
      `Amount ${amountCentimes} exceeds maximum ${config.maxAmount} for ${config.name}`,
    );
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!isMoroccanPhone(normalizedPhone)) {
    errors.push("Invalid Moroccan phone number");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create a mobile wallet payment record.
 */
export function createMobileWalletPayment(
  provider: MobileWalletProvider,
  phoneNumber: string,
  amountCentimes: number,
  reference: string,
): MobileWalletPayment {
  return {
    provider,
    phoneNumber: normalizePhoneNumber(phoneNumber),
    amount: amountCentimes,
    reference,
    status: "initiated",
  };
}

// ---------------------------------------------------------------------------
// RIB (Relevé d'Identité Bancaire) Validation
// ---------------------------------------------------------------------------

/**
 * Validate a Moroccan RIB (24-digit bank account number).
 *
 * Format: BBB SS NNNNNNNNNNNNNN CC
 * - BBB: Bank code (3 digits)
 * - SS: Branch/city code (2-4 digits, padded)
 * - NNNNNNNNNNNNNN: Account number (variable, 16 digits total with branch)
 * - CC: RIB key (2 digits, modulo 97)
 */
export function validateRIB(rib: string): RIBValidation {
  const errors: string[] = [];
  const cleaned = rib.replace(/[\s-]/g, "");

  if (cleaned.length !== 24) {
    errors.push(`RIB must be 24 digits, got ${cleaned.length}`);
    return {
      isValid: false,
      bankCode: "",
      branchCode: "",
      accountNumber: "",
      ribKey: "",
      bankName: "Unknown",
      errors,
    };
  }

  if (!/^\d{24}$/.test(cleaned)) {
    errors.push("RIB must contain only digits");
    return {
      isValid: false,
      bankCode: "",
      branchCode: "",
      accountNumber: "",
      ribKey: "",
      bankName: "Unknown",
      errors,
    };
  }

  const bankCode = cleaned.substring(0, 3);
  const branchCode = cleaned.substring(3, 7);
  const accountNumber = cleaned.substring(7, 22);
  const ribKey = cleaned.substring(22, 24);
  const bankName = BANK_CODES[bankCode] ?? "Unknown Bank";

  // Validate RIB key using modulo 97
  const ribNumber = BigInt(cleaned.substring(0, 22));
  const expectedKey = BigInt(97) - (ribNumber * BigInt(100)) % BigInt(97);
  const actualKey = BigInt(ribKey);

  if (expectedKey !== actualKey) {
    errors.push(
      `Invalid RIB key: expected ${expectedKey.toString()}, got ${ribKey}`,
    );
  }

  return {
    isValid: errors.length === 0,
    bankCode,
    branchCode,
    accountNumber,
    ribKey,
    bankName,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Tax Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate taxes on a delivery order (Morocco rates).
 */
export function calculateTaxes(
  subtotalCentimes: number,
  includesCommunalTax: boolean = false,
): TaxCalculation {
  const vatAmount = Math.round(subtotalCentimes * VAT_RATE);
  const communalTax = includesCommunalTax
    ? Math.round(subtotalCentimes * COMMUNAL_TAX_RATE)
    : 0;

  return {
    subtotal: subtotalCentimes,
    vatAmount,
    vatRate: VAT_RATE,
    communalTax,
    communalTaxRate: includesCommunalTax ? COMMUNAL_TAX_RATE : 0,
    totalWithTax: subtotalCentimes + vatAmount + communalTax,
    currency: "MAD",
  };
}

// ---------------------------------------------------------------------------
// Payment Method Availability
// ---------------------------------------------------------------------------

/**
 * Determine which payment methods are available for a given order.
 */
export function getAvailablePaymentMethods(
  orderAmountCentimes: number,
  city: string,
): PaymentMethodAvailability {
  const cod = orderAmountCentimes <= MAX_COD_AMOUNT;
  const card = orderAmountCentimes >= MIN_CARD_AMOUNT;

  // All wallets available in major cities
  const majorCities = [
    "casablanca",
    "rabat",
    "marrakech",
    "fes",
    "tangier",
    "agadir",
  ];
  const isMajorCity = majorCities.includes(city.toLowerCase());

  const availableWallets: MobileWalletProvider[] = isMajorCity
    ? ["inwi_money", "orange_money", "wafacash", "cashplus", "barid_bank"]
    : ["inwi_money", "orange_money", "barid_bank"];

  return {
    cod,
    card,
    mobileWallet: availableWallets.length > 0,
    bankTransfer: orderAmountCentimes >= 5000,
    availableWallets,
  };
}

// ---------------------------------------------------------------------------
// Phone Number Utilities
// ---------------------------------------------------------------------------

/**
 * Normalize a Moroccan phone number to +212 format.
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");

  if (cleaned.startsWith("+212")) return cleaned;
  if (cleaned.startsWith("00212")) return `+212${cleaned.slice(5)}`;
  if (cleaned.startsWith("0")) return `+212${cleaned.slice(1)}`;

  return cleaned;
}

/**
 * Check if a phone number is a valid Moroccan mobile number.
 */
export function isMoroccanPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^\+212[5-7]\d{8}$/.test(normalized);
}

// ---------------------------------------------------------------------------
// Refund Processing
// ---------------------------------------------------------------------------

/**
 * Validate a refund request.
 */
export function validateRefundRequest(
  request: RefundRequest,
  originalAmount: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (request.amount <= 0) {
    errors.push("Refund amount must be positive");
  }

  if (request.amount > originalAmount) {
    errors.push(
      `Refund amount ${request.amount} exceeds original ${originalAmount}`,
    );
  }

  if (!request.transactionId) {
    errors.push("Transaction ID is required");
  }

  if (!request.reason || request.reason.trim().length < 3) {
    errors.push("Refund reason must be at least 3 characters");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Process a refund (generates a result object).
 */
export function processRefund(request: RefundRequest): RefundResult {
  const validation = validateRefundRequest(request, Infinity);
  if (!validation.valid) {
    return {
      success: false,
      refundId: "",
      amount: request.amount,
      message: validation.errors.join("; "),
    };
  }

  const refundId = `ref-${request.transactionId}-${Date.now()}`;

  logger.info(
    `Refund processed: ${refundId} for ${request.amount} centimes via ${request.method}`,
    "Settlement",
  );

  return {
    success: true,
    refundId,
    amount: request.amount,
    message: `Refund of ${request.amount} centimes processed via ${request.method}`,
  };
}

/**
 * Get the mobile wallet configuration.
 */
export function getMobileWalletConfig(): typeof MOBILE_WALLET_CONFIG {
  return { ...MOBILE_WALLET_CONFIG };
}

/**
 * Get the bank codes directory.
 */
export function getBankCodes(): Record<string, string> {
  return { ...BANK_CODES };
}
