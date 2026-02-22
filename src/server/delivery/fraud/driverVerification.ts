/**
 * Morocco KYC (Know Your Customer) Driver Verification Pipeline
 *
 * Complete document verification for delivery drivers operating in Morocco.
 * Handles CNIE, driving license, insurance, auto-entrepreneur registration,
 * vehicle inspection, medical certificate, casier judiciaire, selfie verification,
 * and vehicle registration (carte grise).
 *
 * Morocco-specific: CNIE format, license categories, RC insurance requirement,
 * Auto-Entrepreneur ICE validation, Bulletin n3 criminal record screening.
 *
 * ZERO external dependencies. Pure functions only.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type DocumentType =
  | "cnie"
  | "driving_license"
  | "insurance"
  | "auto_entrepreneur"
  | "vehicle_inspection"
  | "medical_certificate"
  | "casier_judiciaire"
  | "selfie_verification"
  | "vehicle_registration";

export type VerificationStageType =
  | "initial"
  | "documents_submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "re_verification";

export type DocumentStatus = "pending" | "approved" | "rejected" | "expired";

export type VehicleType = "motorcycle" | "car" | "bicycle" | "van";

export type LicenseCategory = "A" | "A1" | "B" | "C" | "D" | "E";

export type InsuranceCoverageType =
  | "liability"
  | "comprehensive"
  | "third_party";

// ---------------------------------------------------------------------------
// Data types for each document
// ---------------------------------------------------------------------------

export interface CNIEData {
  cnieNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  placeOfBirth?: string;
  address?: string;
  gender?: "M" | "F";
  documentImageUrl?: string;
}

export interface CNIEValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  formatValid: boolean;
  isExpired: boolean;
  isMinimumAge: boolean;
  age: number;
}

export interface LicenseData {
  licenseNumber: string;
  category: LicenseCategory;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority?: string;
  restrictions?: string[];
  vehicleType: VehicleType;
  documentImageUrl?: string;
}

export interface LicenseValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  categoryMatchesVehicle: boolean;
  isExpired: boolean;
  formatValid: boolean;
}

export interface InsuranceData {
  policyNumber: string;
  provider: string;
  coverageType: InsuranceCoverageType;
  startDate: string;
  expiryDate: string;
  vehiclePlate: string;
  hasRC: boolean;
  coverageAmount?: number;
  documentImageUrl?: string;
}

export interface InsuranceValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  hasRequiredRC: boolean;
  isExpired: boolean;
  policyFormatValid: boolean;
  coverageAdequate: boolean;
}

export interface AutoEntrepreneurData {
  registrationNumber: string;
  iceNumber: string;
  firstName: string;
  lastName: string;
  registrationDate: string;
  activityType: string;
  isActive: boolean;
  fiscalId?: string;
  documentImageUrl?: string;
}

export interface AutoEntrepreneurValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  registrationFormatValid: boolean;
  iceFormatValid: boolean;
  isActive: boolean;
}

export interface VehicleInspectionData {
  inspectionDate: string;
  expiryDate: string;
  centerName: string;
  centerAuthorization: string;
  vehiclePlate: string;
  vehicleYear: number;
  result: "pass" | "fail" | "conditional";
  defects?: string[];
  documentImageUrl?: string;
}

export interface VehicleInspectionValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  isExpired: boolean;
  centerAuthorized: boolean;
  resultAcceptable: boolean;
  vehicleAge: number;
}

export interface MedicalCertificateData {
  doctorName: string;
  clinicName: string;
  issueDate: string;
  expiryDate: string;
  isFitToDrive: boolean;
  restrictions?: string[];
  doctorLicenseNumber?: string;
  documentImageUrl?: string;
}

export interface MedicalCertificateValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  isExpired: boolean;
  isFitToDrive: boolean;
  doctorInfoValid: boolean;
}

export interface CriminalRecord {
  offense: string;
  date: string;
  severity: "minor" | "major" | "felony";
  sentence?: string;
  isExpunged: boolean;
}

export interface CasierJudiciaireData {
  bulletinNumber: string;
  issueDate: string;
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  records: CriminalRecord[];
  isClean: boolean;
  documentImageUrl?: string;
}

export interface CasierJudiciaireValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  isRecent: boolean;
  hasDisqualifyingOffenses: boolean;
  disqualifyingOffenses: string[];
  bulletinFormatValid: boolean;
}

export interface SelfieVerificationData {
  selfieImageUrl: string;
  cnieImageUrl: string;
  faceMatchScore: number;
  livenessScore: number;
  isLive: boolean;
  captureTimestamp: string;
  deviceInfo?: string;
}

export interface SelfieVerificationValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  faceMatchPassed: boolean;
  livenessPassed: boolean;
  scoreAboveThreshold: boolean;
}

export interface VehicleRegistrationData {
  plateNumber: string;
  ownerName: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleType: VehicleType;
  registrationDate: string;
  expiryDate?: string;
  documentImageUrl?: string;
}

export interface VehicleRegistrationValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  plateFormatValid: boolean;
  vehicleAgeAcceptable: boolean;
  ownerNameMatch: boolean;
}

// ---------------------------------------------------------------------------
// Compound / Pipeline types
// ---------------------------------------------------------------------------

export interface DriverDocument {
  id: string;
  driverId: string;
  type: DocumentType;
  status: DocumentStatus;
  submittedAt: string;
  reviewedAt?: string;
  expiryDate?: string;
  rejectionReason?: string;
  documentData: unknown;
  documentImageUrl?: string;
}

export interface KYCProgress {
  driverId: string;
  totalRequired: number;
  totalSubmitted: number;
  totalApproved: number;
  totalRejected: number;
  totalExpired: number;
  totalPending: number;
  completionPercentage: number;
  missingDocuments: DocumentType[];
  expiredDocuments: DocumentType[];
  rejectedDocuments: DocumentType[];
  pendingDocuments: DocumentType[];
  approvedDocuments: DocumentType[];
  isComplete: boolean;
}

export interface ExpiryAlert {
  documentType: DocumentType;
  driverId: string;
  expiryDate: string;
  daysUntilExpiry: number;
  severity: AlertSeverity;
  message: string;
}

export interface VerificationStage {
  stage: VerificationStageType;
  reason: string;
  canOperate: boolean;
  requiredActions: string[];
  nextReviewDate?: string;
}

export interface ReVerificationSchedule {
  driverId: string;
  nextVerificationDate: string;
  documentsToRenew: DocumentType[];
  urgentRenewals: DocumentType[];
  scheduledChecks: Array<{
    documentType: DocumentType;
    checkDate: string;
    reason: string;
  }>;
}

export interface ReVerificationTask {
  driverId: string;
  documentType: DocumentType;
  taskType: "renewal" | "re_upload" | "re_verify" | "expiry_check";
  priority: AlertSeverity;
  dueDate: string;
  description: string;
}

export interface DriverProfile {
  driverId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  vehicleType: VehicleType;
  documents: DriverDocument[];
  registrationDate: string;
  city?: string;
  phone?: string;
}

export interface KYCResult {
  driverId: string;
  stage: VerificationStage;
  progress: KYCProgress;
  expiryAlerts: ExpiryAlert[];
  reVerificationSchedule: ReVerificationSchedule;
  eligible: boolean;
  overallRisk: AlertSeverity;
  notes: string[];
  assessedAt: string;
}

export interface FleetKYCStats {
  totalDrivers: number;
  fullyCompliant: number;
  partiallyCompliant: number;
  nonCompliant: number;
  complianceRate: number;
  averageCompletion: number;
  documentsByStatus: Record<DocumentStatus, number>;
  expiringWithin30Days: number;
  expiringWithin7Days: number;
  riskDistribution: Record<AlertSeverity, number>;
  mostCommonMissing: Array<{ type: DocumentType; count: number }>;
}

export interface ComplianceResult {
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  score: number;
  details: Array<{
    documentType: DocumentType;
    status: DocumentStatus;
    compliant: boolean;
    issue?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86400000;
const CNIE_VALIDITY_YEARS = 10;
const LICENSE_VALIDITY_YEARS = 10;
const INSURANCE_VALIDITY_MONTHS = 12;
const AUTO_ENTREPRENEUR_VALIDITY_YEARS = 5;
const VEHICLE_INSPECTION_VALIDITY_MONTHS = 12;
const MEDICAL_CERTIFICATE_VALIDITY_MONTHS = 24;
const CASIER_VALIDITY_MONTHS = 3;
const SELFIE_MIN_MATCH_SCORE = 80;
const EXPIRY_ALERT_DAYS: readonly number[] = [30, 15, 7, 1];
const MIN_DRIVER_AGE = 18;
const MAX_VEHICLE_AGE_YEARS = 20;
const MIN_LIVENESS_SCORE = 70;

export const KYC_CONSTANTS = {
  CNIE_VALIDITY_YEARS,
  LICENSE_VALIDITY_YEARS,
  INSURANCE_VALIDITY_MONTHS,
  AUTO_ENTREPRENEUR_VALIDITY_YEARS,
  VEHICLE_INSPECTION_VALIDITY_MONTHS,
  MEDICAL_CERTIFICATE_VALIDITY_MONTHS,
  CASIER_VALIDITY_MONTHS,
  SELFIE_MIN_MATCH_SCORE,
  EXPIRY_ALERT_DAYS,
  MIN_DRIVER_AGE,
  MAX_VEHICLE_AGE_YEARS,
  MIN_LIVENESS_SCORE,
  MS_PER_DAY,
} as const;

/**
 * Disqualifying criminal offenses for delivery drivers.
 * Uses whole-word boundary matching to avoid false positives
 * (e.g., "infraction" must NOT match "fraude").
 */
const DISQUALIFYING_OFFENSES: readonly string[] = [
  "vol",
  "agression",
  "violence",
  "drogue",
  "stupefiants",
  "fraude",
  "escroquerie",
  "abus de confiance",
  "homicide",
  "kidnapping",
  "trafic",
];

/**
 * Required license categories per vehicle type.
 */
const VEHICLE_LICENSE_MAP: Record<VehicleType, LicenseCategory[]> = {
  motorcycle: ["A", "A1"],
  car: ["B"],
  bicycle: [],
  van: ["B", "C"],
};

/**
 * All 9 document types in order.
 */
const ALL_DOCUMENT_TYPES: readonly DocumentType[] = [
  "cnie",
  "driving_license",
  "insurance",
  "auto_entrepreneur",
  "vehicle_inspection",
  "medical_certificate",
  "casier_judiciaire",
  "selfie_verification",
  "vehicle_registration",
];

/**
 * Human-readable names for document types (French/Morocco official names).
 */
const DOCUMENT_TYPE_NAMES: Record<DocumentType, string> = {
  cnie: "Carte Nationale d'Identite Electronique (CNIE)",
  driving_license: "Permis de Conduire",
  insurance: "Attestation d'Assurance",
  auto_entrepreneur: "Carte Auto-Entrepreneur",
  vehicle_inspection: "Controle Technique",
  medical_certificate: "Certificat Medical",
  casier_judiciaire: "Casier Judiciaire (Bulletin n3)",
  selfie_verification: "Selfie avec CNIE",
  vehicle_registration: "Carte Grise",
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Parse an ISO date string to a Unix timestamp (milliseconds).
 * Returns NaN if the string is invalid.
 */
function parseDate(dateStr: string): number {
  if (!dateStr || typeof dateStr !== "string") {
    return NaN;
  }
  const ts = Date.parse(dateStr);
  return ts;
}

/**
 * Check if a date string is within N months from a reference date.
 * Returns true if the date is within the range.
 */
function isWithinMonths(
  dateStr: string,
  months: number,
  referenceDate: number,
): boolean {
  const date = parseDate(dateStr);
  if (isNaN(date)) return false;
  const diffMs = referenceDate - date;
  const monthsElapsed = diffMs / (MS_PER_DAY * 30.44);
  return monthsElapsed <= months;
}

/**
 * Check if a date string has expired relative to a reference date.
 */
function isExpired(dateStr: string, referenceDate: number): boolean {
  const date = parseDate(dateStr);
  if (isNaN(date)) return true;
  return date < referenceDate;
}

/**
 * Calculate the number of days between two timestamps.
 * Returns a positive number if date2 is after date1.
 */
function daysBetween(date1: number, date2: number): number {
  return Math.floor((date2 - date1) / MS_PER_DAY);
}

/**
 * Calculate age in years from a date of birth string.
 */
function calculateAge(dateOfBirth: string, referenceDate: number): number {
  const dob = parseDate(dateOfBirth);
  if (isNaN(dob)) return 0;
  const ageDays = daysBetween(dob, referenceDate);
  return Math.floor(ageDays / 365.25);
}

/**
 * Validate CNIE number format.
 * Morocco CNIE: 1-2 letters followed by 6-7 digits (e.g., "AB123456", "J123456").
 */
function isValidCNIEFormat(cnieNumber: string): boolean {
  if (!cnieNumber || typeof cnieNumber !== "string") return false;
  const pattern = /^[A-Z]{1,2}\d{6,7}$/;
  return pattern.test(cnieNumber.trim().toUpperCase());
}

/**
 * Validate Morocco license number format.
 * Typically a numeric string, 5-10 digits.
 */
function isValidLicenseFormat(licenseNumber: string): boolean {
  if (!licenseNumber || typeof licenseNumber !== "string") return false;
  const pattern = /^\d{5,10}$/;
  return pattern.test(licenseNumber.trim());
}

/**
 * Validate insurance policy number format.
 * Alphanumeric, typically 6-20 characters.
 */
function isValidPolicyFormat(policyNumber: string): boolean {
  if (!policyNumber || typeof policyNumber !== "string") return false;
  const pattern = /^[A-Z0-9]{6,20}$/i;
  return pattern.test(policyNumber.trim());
}

/**
 * Validate Auto-Entrepreneur registration number format.
 * Typically numeric, 8-15 digits.
 */
function isValidAutoEntrepreneurFormat(registrationNumber: string): boolean {
  if (!registrationNumber || typeof registrationNumber !== "string")
    return false;
  const pattern = /^\d{8,15}$/;
  return pattern.test(registrationNumber.trim());
}

/**
 * Validate ICE (Identifiant Commun de l'Entreprise) number format.
 * 15 digits in Morocco.
 */
function isValidICEFormat(iceNumber: string): boolean {
  if (!iceNumber || typeof iceNumber !== "string") return false;
  const pattern = /^\d{15}$/;
  return pattern.test(iceNumber.trim());
}

/**
 * Validate Casier Judiciaire Bulletin number format.
 * Alphanumeric, typically 6-20 characters.
 */
function isValidBulletinFormat(bulletinNumber: string): boolean {
  if (!bulletinNumber || typeof bulletinNumber !== "string") return false;
  const pattern = /^[A-Z0-9/-]{4,20}$/i;
  return pattern.test(bulletinNumber.trim());
}

/**
 * Validate Morocco vehicle plate number format.
 * Patterns: "12345-A-6" or similar regional formats.
 */
function isValidPlateFormat(plateNumber: string): boolean {
  if (!plateNumber || typeof plateNumber !== "string") return false;
  const trimmed = plateNumber.trim();
  // Morocco plates: digits-letter(s)-digits or other combinations
  const pattern = /^[A-Z0-9-]{4,15}$/i;
  return pattern.test(trimmed);
}

/**
 * Check if a criminal record contains disqualifying offenses.
 * Uses whole-word boundary matching to avoid false positives.
 * "Minor parking infraction" should NOT match "fraude" or any keyword.
 */
function containsDisqualifyingOffense(offense: string): boolean {
  if (!offense || typeof offense !== "string") return false;
  const normalized = offense.toLowerCase().trim();

  for (const keyword of DISQUALIFYING_OFFENSES) {
    // Build a regex with word boundaries for whole-word matching.
    // For multi-word phrases like "abus de confiance", match the exact phrase.
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Map severity from days until expiry.
 */
function expiryDaysToSeverity(days: number): AlertSeverity {
  if (days <= 1) return "critical";
  if (days <= 7) return "high";
  if (days <= 15) return "medium";
  return "low";
}

/**
 * Get current timestamp for default reference date.
 */
function nowTimestamp(): number {
  return Date.now();
}

/**
 * Validate that a string is a non-empty trimmed value.
 */
function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Safely extract a string property from unknown data.
 */
function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

/**
 * Add months to a date string, returning an ISO string.
 */
function addMonthsToDate(dateStr: string, months: number): string {
  const ts = parseDate(dateStr);
  if (isNaN(ts)) return dateStr;
  const date = new Date(ts);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

/**
 * Add years to a date string, returning an ISO string.
 */
function addYearsToDate(dateStr: string, years: number): string {
  const ts = parseDate(dateStr);
  if (isNaN(ts)) return dateStr;
  const date = new Date(ts);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// Document requirement rules
// ---------------------------------------------------------------------------

/**
 * Get the list of required documents based on vehicle type.
 * Bicycles have reduced requirements (no driving license, insurance, vehicle inspection,
 * or vehicle registration).
 */
export function getRequiredDocuments(vehicleType: VehicleType): DocumentType[] {
  const base: DocumentType[] = [
    "cnie",
    "auto_entrepreneur",
    "medical_certificate",
    "casier_judiciaire",
    "selfie_verification",
  ];

  if (vehicleType === "bicycle") {
    return base;
  }

  return [
    ...base,
    "driving_license",
    "insurance",
    "vehicle_inspection",
    "vehicle_registration",
  ];
}

// ---------------------------------------------------------------------------
// Individual document validators
// ---------------------------------------------------------------------------

/**
 * Validate a CNIE (Carte Nationale d'Identite Electronique).
 * Checks format, expiry, and minimum age.
 */
export function validateCNIE(data: CNIEData): CNIEValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refDate = nowTimestamp();

  // Format validation
  const formatValid = isValidCNIEFormat(data.cnieNumber);
  if (!formatValid) {
    errors.push(
      "CNIE number format invalid. Expected 1-2 letters followed by 6-7 digits (e.g., AB123456)",
    );
  }

  // Required fields
  if (!isNonEmpty(data.firstName)) {
    errors.push("First name is required");
  }
  if (!isNonEmpty(data.lastName)) {
    errors.push("Last name is required");
  }
  if (!isNonEmpty(data.dateOfBirth)) {
    errors.push("Date of birth is required");
  }
  if (!isNonEmpty(data.issueDate)) {
    errors.push("Issue date is required");
  }
  if (!isNonEmpty(data.expiryDate)) {
    errors.push("Expiry date is required");
  }

  // Expiry check
  const expired = isNonEmpty(data.expiryDate)
    ? isExpired(data.expiryDate, refDate)
    : true;
  if (expired) {
    errors.push("CNIE has expired");
  }

  // Age check
  const age = isNonEmpty(data.dateOfBirth)
    ? calculateAge(data.dateOfBirth, refDate)
    : 0;
  const meetsMinAge = age >= MIN_DRIVER_AGE;
  if (!meetsMinAge && isNonEmpty(data.dateOfBirth)) {
    errors.push(
      `Driver must be at least ${MIN_DRIVER_AGE} years old. Current age: ${age}`,
    );
  }

  // Validity period warning
  if (isNonEmpty(data.issueDate) && isNonEmpty(data.expiryDate)) {
    const issueTs = parseDate(data.issueDate);
    const expiryTs = parseDate(data.expiryDate);
    if (!isNaN(issueTs) && !isNaN(expiryTs)) {
      const validityYears = daysBetween(issueTs, expiryTs) / 365.25;
      if (validityYears > CNIE_VALIDITY_YEARS + 1) {
        warnings.push(
          `CNIE validity period (${Math.round(validityYears)} years) exceeds standard ${CNIE_VALIDITY_YEARS}-year period`,
        );
      }
    }
  }

  // Approaching expiry warning
  if (!expired && isNonEmpty(data.expiryDate)) {
    const expiryTs = parseDate(data.expiryDate);
    if (!isNaN(expiryTs)) {
      const daysLeft = daysBetween(refDate, expiryTs);
      if (daysLeft <= 30) {
        warnings.push(
          `CNIE expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        );
      }
    }
  }

  // Date of birth sanity check
  if (isNonEmpty(data.dateOfBirth)) {
    const dobTs = parseDate(data.dateOfBirth);
    if (!isNaN(dobTs) && dobTs > refDate) {
      errors.push("Date of birth cannot be in the future");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    formatValid,
    isExpired: expired,
    isMinimumAge: meetsMinAge,
    age,
  };
}

/**
 * Validate a driving license.
 * Checks category matches vehicle type, format, and expiry.
 */
export function validateDrivingLicense(data: LicenseData): LicenseValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refDate = nowTimestamp();

  // Format validation
  const formatValid = isValidLicenseFormat(data.licenseNumber);
  if (!formatValid) {
    errors.push("License number format invalid. Expected 5-10 digits");
  }

  // Required fields
  if (!isNonEmpty(data.firstName)) {
    errors.push("First name is required");
  }
  if (!isNonEmpty(data.lastName)) {
    errors.push("Last name is required");
  }
  if (!data.category) {
    errors.push("License category is required");
  }
  if (!isNonEmpty(data.issueDate)) {
    errors.push("Issue date is required");
  }
  if (!isNonEmpty(data.expiryDate)) {
    errors.push("Expiry date is required");
  }

  // Category vs vehicle type match
  const requiredCategories = VEHICLE_LICENSE_MAP[data.vehicleType] ?? [];
  const categoryMatches =
    requiredCategories.length === 0 ||
    requiredCategories.includes(data.category);
  if (!categoryMatches) {
    errors.push(
      `License category ${data.category} does not match vehicle type ${data.vehicleType}. Required: ${requiredCategories.join(" or ")}`,
    );
  }

  // Expiry check
  const expired = isNonEmpty(data.expiryDate)
    ? isExpired(data.expiryDate, refDate)
    : true;
  if (expired) {
    errors.push("Driving license has expired");
  }

  // Approaching expiry warning
  if (!expired && isNonEmpty(data.expiryDate)) {
    const expiryTs = parseDate(data.expiryDate);
    if (!isNaN(expiryTs)) {
      const daysLeft = daysBetween(refDate, expiryTs);
      if (daysLeft <= 30) {
        warnings.push(
          `Driving license expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        );
      }
    }
  }

  // Restrictions warning
  if (data.restrictions && data.restrictions.length > 0) {
    warnings.push(
      `License has restrictions: ${data.restrictions.join(", ")}`,
    );
  }

  // Age check for motorcycle
  if (isNonEmpty(data.dateOfBirth)) {
    const age = calculateAge(data.dateOfBirth, refDate);
    if (data.vehicleType === "motorcycle" && age < 16) {
      errors.push("Motorcycle riders must be at least 16 years old");
    }
    if (data.vehicleType === "car" && age < 18) {
      errors.push("Car drivers must be at least 18 years old");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    categoryMatchesVehicle: categoryMatches,
    isExpired: expired,
    formatValid,
  };
}

/**
 * Validate an insurance certificate.
 * Checks RC (responsabilite civile) coverage, policy format, and expiry.
 */
export function validateInsurance(data: InsuranceData): InsuranceValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refDate = nowTimestamp();

  // Policy format validation
  const policyFormatValid = isValidPolicyFormat(data.policyNumber);
  if (!policyFormatValid) {
    errors.push(
      "Policy number format invalid. Expected 6-20 alphanumeric characters",
    );
  }

  // Required fields
  if (!isNonEmpty(data.provider)) {
    errors.push("Insurance provider is required");
  }
  if (!data.coverageType) {
    errors.push("Coverage type is required");
  }
  if (!isNonEmpty(data.startDate)) {
    errors.push("Start date is required");
  }
  if (!isNonEmpty(data.expiryDate)) {
    errors.push("Expiry date is required");
  }
  if (!isNonEmpty(data.vehiclePlate)) {
    errors.push("Vehicle plate number is required");
  }

  // RC coverage check (mandatory in Morocco)
  const hasRequiredRC = data.hasRC === true;
  if (!hasRequiredRC) {
    errors.push(
      "Insurance must include RC (Responsabilite Civile) coverage - mandatory in Morocco",
    );
  }

  // Expiry check
  const expired = isNonEmpty(data.expiryDate)
    ? isExpired(data.expiryDate, refDate)
    : true;
  if (expired) {
    errors.push("Insurance policy has expired");
  }

  // Coverage adequacy
  let coverageAdequate = true;
  if (data.coverageType === "third_party") {
    warnings.push(
      "Third-party only coverage detected. Comprehensive or liability coverage recommended",
    );
  }
  if (data.coverageAmount !== undefined && data.coverageAmount < 100000) {
    warnings.push(
      "Coverage amount appears low. Minimum recommended: 100,000 MAD",
    );
    coverageAdequate = false;
  }

  // Start date validation
  if (isNonEmpty(data.startDate) && isNonEmpty(data.expiryDate)) {
    const startTs = parseDate(data.startDate);
    const expiryTs = parseDate(data.expiryDate);
    if (!isNaN(startTs) && !isNaN(expiryTs) && startTs >= expiryTs) {
      errors.push("Start date must be before expiry date");
    }
  }

  // Approaching expiry warning
  if (!expired && isNonEmpty(data.expiryDate)) {
    const expiryTs = parseDate(data.expiryDate);
    if (!isNaN(expiryTs)) {
      const daysLeft = daysBetween(refDate, expiryTs);
      if (daysLeft <= 30) {
        warnings.push(
          `Insurance expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    hasRequiredRC: hasRequiredRC,
    isExpired: expired,
    policyFormatValid,
    coverageAdequate,
  };
}

/**
 * Validate an Auto-Entrepreneur registration card.
 * Checks registration number, ICE number, and active status.
 */
export function validateAutoEntrepreneur(
  data: AutoEntrepreneurData,
): AutoEntrepreneurValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Registration number format
  const registrationFormatValid = isValidAutoEntrepreneurFormat(
    data.registrationNumber,
  );
  if (!registrationFormatValid) {
    errors.push(
      "Auto-Entrepreneur registration number format invalid. Expected 8-15 digits",
    );
  }

  // ICE number format
  const iceFormatValid = isValidICEFormat(data.iceNumber);
  if (!iceFormatValid) {
    errors.push("ICE number format invalid. Expected 15 digits");
  }

  // Required fields
  if (!isNonEmpty(data.firstName)) {
    errors.push("First name is required");
  }
  if (!isNonEmpty(data.lastName)) {
    errors.push("Last name is required");
  }
  if (!isNonEmpty(data.registrationDate)) {
    errors.push("Registration date is required");
  }
  if (!isNonEmpty(data.activityType)) {
    errors.push("Activity type is required");
  }

  // Active status check
  if (!data.isActive) {
    errors.push(
      "Auto-Entrepreneur status is inactive. Must be active to operate as delivery driver",
    );
  }

  // Registration date validation
  if (isNonEmpty(data.registrationDate)) {
    const regTs = parseDate(data.registrationDate);
    const refDate = nowTimestamp();
    if (!isNaN(regTs) && regTs > refDate) {
      errors.push("Registration date cannot be in the future");
    }

    // Check if registration is within validity period
    if (
      !isNaN(regTs) &&
      !isWithinMonths(
        data.registrationDate,
        AUTO_ENTREPRENEUR_VALIDITY_YEARS * 12,
        refDate,
      )
    ) {
      warnings.push(
        `Registration is over ${AUTO_ENTREPRENEUR_VALIDITY_YEARS} years old. Renewal may be required`,
      );
    }
  }

  // Activity type warning
  if (isNonEmpty(data.activityType)) {
    const deliveryRelated = [
      "livraison",
      "transport",
      "coursier",
      "delivery",
      "logistics",
    ];
    const isDeliveryRelated = deliveryRelated.some((keyword) =>
      data.activityType.toLowerCase().includes(keyword),
    );
    if (!isDeliveryRelated) {
      warnings.push(
        `Activity type "${data.activityType}" may not cover delivery services. Verify with tax authority`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    registrationFormatValid,
    iceFormatValid,
    isActive: data.isActive,
  };
}

/**
 * Validate a vehicle inspection (Controle Technique) certificate.
 * Checks inspection date, center authorization, and result.
 */
export function validateVehicleInspection(
  data: VehicleInspectionData,
): VehicleInspectionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refDate = nowTimestamp();

  // Required fields
  if (!isNonEmpty(data.inspectionDate)) {
    errors.push("Inspection date is required");
  }
  if (!isNonEmpty(data.expiryDate)) {
    errors.push("Expiry date is required");
  }
  if (!isNonEmpty(data.centerName)) {
    errors.push("Inspection center name is required");
  }
  if (!isNonEmpty(data.centerAuthorization)) {
    errors.push("Center authorization number is required");
  }
  if (!isNonEmpty(data.vehiclePlate)) {
    errors.push("Vehicle plate number is required");
  }

  // Center authorization format check
  const centerAuthorized =
    isNonEmpty(data.centerAuthorization) &&
    data.centerAuthorization.trim().length >= 3;
  if (!centerAuthorized) {
    errors.push(
      "Inspection center authorization number appears invalid",
    );
  }

  // Expiry check
  const expired = isNonEmpty(data.expiryDate)
    ? isExpired(data.expiryDate, refDate)
    : true;
  if (expired) {
    errors.push("Vehicle inspection has expired");
  }

  // Result check
  const resultAcceptable = data.result === "pass";
  if (data.result === "fail") {
    errors.push(
      "Vehicle failed inspection. Must pass inspection to operate",
    );
  }
  if (data.result === "conditional") {
    warnings.push(
      "Vehicle passed with conditions. Defects must be addressed within deadline",
    );
  }

  // Vehicle age calculation
  const currentYear = new Date(refDate).getFullYear();
  const vehicleAge = currentYear - (data.vehicleYear ?? currentYear);

  if (vehicleAge > MAX_VEHICLE_AGE_YEARS) {
    warnings.push(
      `Vehicle is ${vehicleAge} years old. Vehicles over ${MAX_VEHICLE_AGE_YEARS} years require more frequent inspections`,
    );
  }

  // Vehicles > 5 years need annual inspection
  if (vehicleAge > 5) {
    if (isNonEmpty(data.inspectionDate) && isNonEmpty(data.expiryDate)) {
      const inspTs = parseDate(data.inspectionDate);
      const expTs = parseDate(data.expiryDate);
      if (!isNaN(inspTs) && !isNaN(expTs)) {
        const validityMonths = daysBetween(inspTs, expTs) / 30.44;
        if (validityMonths > VEHICLE_INSPECTION_VALIDITY_MONTHS + 1) {
          warnings.push(
            "Vehicle over 5 years old requires annual inspection. Validity period may be incorrect",
          );
        }
      }
    }
  }

  // Defects warning
  if (data.defects && data.defects.length > 0) {
    warnings.push(
      `${data.defects.length} defect(s) noted: ${data.defects.join(", ")}`,
    );
  }

  // Approaching expiry
  if (!expired && isNonEmpty(data.expiryDate)) {
    const expiryTs = parseDate(data.expiryDate);
    if (!isNaN(expiryTs)) {
      const daysLeft = daysBetween(refDate, expiryTs);
      if (daysLeft <= 30) {
        warnings.push(
          `Vehicle inspection expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    isExpired: expired,
    centerAuthorized,
    resultAcceptable,
    vehicleAge,
  };
}

/**
 * Validate a medical certificate (aptitude physique).
 * Checks doctor/clinic info, validity period (2 years), and fitness declaration.
 */
export function validateMedicalCertificate(
  data: MedicalCertificateData,
): MedicalCertificateValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refDate = nowTimestamp();

  // Required fields
  if (!isNonEmpty(data.doctorName)) {
    errors.push("Doctor name is required");
  }
  if (!isNonEmpty(data.clinicName)) {
    errors.push("Clinic name is required");
  }
  if (!isNonEmpty(data.issueDate)) {
    errors.push("Issue date is required");
  }
  if (!isNonEmpty(data.expiryDate)) {
    errors.push("Expiry date is required");
  }

  // Doctor info validation
  const doctorInfoValid =
    isNonEmpty(data.doctorName) && isNonEmpty(data.clinicName);

  // Fitness declaration
  if (!data.isFitToDrive) {
    errors.push(
      "Medical certificate does not declare driver fit to drive",
    );
  }

  // Expiry check
  const expired = isNonEmpty(data.expiryDate)
    ? isExpired(data.expiryDate, refDate)
    : true;
  if (expired) {
    errors.push("Medical certificate has expired");
  }

  // Validity period check
  if (isNonEmpty(data.issueDate) && isNonEmpty(data.expiryDate)) {
    const issueTs = parseDate(data.issueDate);
    const expiryTs = parseDate(data.expiryDate);
    if (!isNaN(issueTs) && !isNaN(expiryTs)) {
      const validityMonths = daysBetween(issueTs, expiryTs) / 30.44;
      if (validityMonths > MEDICAL_CERTIFICATE_VALIDITY_MONTHS + 1) {
        warnings.push(
          `Medical certificate validity (${Math.round(validityMonths)} months) exceeds standard ${MEDICAL_CERTIFICATE_VALIDITY_MONTHS}-month period`,
        );
      }
    }
  }

  // Doctor license number
  if (data.doctorLicenseNumber && data.doctorLicenseNumber.trim().length < 3) {
    warnings.push("Doctor license number appears incomplete");
  }

  // Restrictions
  if (data.restrictions && data.restrictions.length > 0) {
    warnings.push(
      `Medical restrictions noted: ${data.restrictions.join(", ")}`,
    );
  }

  // Approaching expiry
  if (!expired && isNonEmpty(data.expiryDate)) {
    const expiryTs = parseDate(data.expiryDate);
    if (!isNaN(expiryTs)) {
      const daysLeft = daysBetween(refDate, expiryTs);
      if (daysLeft <= 30) {
        warnings.push(
          `Medical certificate expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    isExpired: expired,
    isFitToDrive: data.isFitToDrive,
    doctorInfoValid,
  };
}

/**
 * Validate a Casier Judiciaire (criminal record extract - Bulletin n3).
 * Checks issue date recency (3 months), scans for disqualifying offenses.
 */
export function validateCasierJudiciaire(
  data: CasierJudiciaireData,
): CasierJudiciaireValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refDate = nowTimestamp();

  // Required fields
  if (!isNonEmpty(data.bulletinNumber)) {
    errors.push("Bulletin number is required");
  }
  if (!isNonEmpty(data.issueDate)) {
    errors.push("Issue date is required");
  }
  if (!isNonEmpty(data.fullName)) {
    errors.push("Full name is required");
  }
  if (!isNonEmpty(data.dateOfBirth)) {
    errors.push("Date of birth is required");
  }
  if (!isNonEmpty(data.placeOfBirth)) {
    errors.push("Place of birth is required");
  }

  // Bulletin format check
  const bulletinFormatValid = isValidBulletinFormat(data.bulletinNumber);
  if (!bulletinFormatValid) {
    errors.push("Bulletin number format appears invalid");
  }

  // Recency check (Casier Judiciaire must be less than 3 months old)
  const isRecent = isNonEmpty(data.issueDate)
    ? isWithinMonths(data.issueDate, CASIER_VALIDITY_MONTHS, refDate)
    : false;
  if (!isRecent && isNonEmpty(data.issueDate)) {
    errors.push(
      `Casier Judiciaire is more than ${CASIER_VALIDITY_MONTHS} months old. A recent extract is required`,
    );
  }

  // Scan for disqualifying offenses
  const disqualifyingOffenses: string[] = [];
  if (data.records && Array.isArray(data.records)) {
    for (const record of data.records) {
      if (record.isExpunged) continue;

      if (containsDisqualifyingOffense(record.offense)) {
        disqualifyingOffenses.push(record.offense);
      }
    }
  }

  const hasDisqualifyingOffenses = disqualifyingOffenses.length > 0;
  if (hasDisqualifyingOffenses) {
    errors.push(
      `Disqualifying offenses found: ${disqualifyingOffenses.join(", ")}`,
    );
  }

  // Clean record inconsistency check
  if (
    data.isClean &&
    data.records &&
    data.records.filter((r) => !r.isExpunged).length > 0
  ) {
    warnings.push(
      "Record marked as clean but contains non-expunged entries. Manual review required",
    );
  }

  // Non-disqualifying records warning
  if (data.records && Array.isArray(data.records)) {
    const nonExpungedNonDisqualifying = data.records.filter(
      (r) => !r.isExpunged && !containsDisqualifyingOffense(r.offense),
    );
    if (nonExpungedNonDisqualifying.length > 0) {
      warnings.push(
        `${nonExpungedNonDisqualifying.length} non-disqualifying record(s) found. Manual review recommended`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    isRecent,
    hasDisqualifyingOffenses,
    disqualifyingOffenses,
    bulletinFormatValid,
  };
}

/**
 * Validate selfie with CNIE for identity verification.
 * Checks face match score (minimum 80%), liveness detection.
 */
export function validateSelfieWithCNIE(
  data: SelfieVerificationData,
): SelfieVerificationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!isNonEmpty(data.selfieImageUrl)) {
    errors.push("Selfie image URL is required");
  }
  if (!isNonEmpty(data.cnieImageUrl)) {
    errors.push("CNIE image URL is required");
  }
  if (!isNonEmpty(data.captureTimestamp)) {
    errors.push("Capture timestamp is required");
  }

  // Face match score check
  const scoreAboveThreshold = data.faceMatchScore >= SELFIE_MIN_MATCH_SCORE;
  if (!scoreAboveThreshold) {
    errors.push(
      `Face match score ${data.faceMatchScore}% is below minimum threshold of ${SELFIE_MIN_MATCH_SCORE}%`,
    );
  }
  if (
    scoreAboveThreshold &&
    data.faceMatchScore < SELFIE_MIN_MATCH_SCORE + 10
  ) {
    warnings.push(
      `Face match score ${data.faceMatchScore}% is close to threshold. Consider re-verification`,
    );
  }

  // Liveness check
  const livenessPassed = data.isLive === true;
  if (!livenessPassed) {
    errors.push(
      "Liveness check failed. A live selfie is required for verification",
    );
  }

  // Liveness score check
  if (data.livenessScore < MIN_LIVENESS_SCORE) {
    errors.push(
      `Liveness score ${data.livenessScore}% is below minimum threshold of ${MIN_LIVENESS_SCORE}%`,
    );
  }

  // Face match passed overall
  const faceMatchPassed = scoreAboveThreshold && livenessPassed;

  // Capture timestamp freshness (should be within last 24 hours for new submissions)
  if (isNonEmpty(data.captureTimestamp)) {
    const captureTs = parseDate(data.captureTimestamp);
    const refDate = nowTimestamp();
    if (!isNaN(captureTs)) {
      const hoursAgo = (refDate - captureTs) / (MS_PER_DAY / 24);
      if (hoursAgo > 24) {
        warnings.push(
          "Selfie was captured more than 24 hours ago. A fresh selfie is recommended",
        );
      }
      if (captureTs > refDate) {
        errors.push("Capture timestamp is in the future");
      }
    }
  }

  // Device info warning
  if (data.deviceInfo && data.deviceInfo.toLowerCase().includes("emulator")) {
    warnings.push(
      "Selfie appears to have been captured on an emulator device",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    faceMatchPassed,
    livenessPassed,
    scoreAboveThreshold,
  };
}

/**
 * Validate vehicle registration (Carte Grise).
 * Checks plate format, vehicle age, and owner name.
 */
function validateVehicleRegistration(
  data: VehicleRegistrationData,
  driverName?: string,
): VehicleRegistrationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refDate = nowTimestamp();

  // Required fields
  if (!isNonEmpty(data.plateNumber)) {
    errors.push("Plate number is required");
  }
  if (!isNonEmpty(data.ownerName)) {
    errors.push("Owner name is required");
  }
  if (!isNonEmpty(data.vehicleMake)) {
    errors.push("Vehicle make is required");
  }
  if (!isNonEmpty(data.vehicleModel)) {
    errors.push("Vehicle model is required");
  }
  if (!isNonEmpty(data.registrationDate)) {
    errors.push("Registration date is required");
  }

  // Plate format
  const plateFormatValid = isValidPlateFormat(data.plateNumber);
  if (!plateFormatValid) {
    errors.push("Vehicle plate number format appears invalid");
  }

  // Vehicle age check
  const currentYear = new Date(refDate).getFullYear();
  const vehicleAge = currentYear - (data.vehicleYear ?? currentYear);
  const vehicleAgeAcceptable = vehicleAge <= MAX_VEHICLE_AGE_YEARS;
  if (!vehicleAgeAcceptable) {
    errors.push(
      `Vehicle is ${vehicleAge} years old. Maximum allowed age is ${MAX_VEHICLE_AGE_YEARS} years`,
    );
  }
  if (vehicleAgeAcceptable && vehicleAge > 15) {
    warnings.push(
      `Vehicle is ${vehicleAge} years old. Consider upgrading for reliability`,
    );
  }

  // Owner name match
  let ownerNameMatch = true;
  if (driverName && isNonEmpty(data.ownerName)) {
    const normalizedOwner = data.ownerName.toLowerCase().trim();
    const normalizedDriver = driverName.toLowerCase().trim();
    ownerNameMatch =
      normalizedOwner.includes(normalizedDriver) ||
      normalizedDriver.includes(normalizedOwner);
    if (!ownerNameMatch) {
      warnings.push(
        `Vehicle owner "${data.ownerName}" does not match driver name "${driverName}". Authorization letter may be required`,
      );
    }
  }

  // Expiry check for registration
  if (isNonEmpty(data.expiryDate)) {
    if (isExpired(data.expiryDate, refDate)) {
      errors.push("Vehicle registration has expired");
    } else {
      const expiryTs = parseDate(data.expiryDate);
      if (!isNaN(expiryTs)) {
        const daysLeft = daysBetween(refDate, expiryTs);
        if (daysLeft <= 30) {
          warnings.push(
            `Vehicle registration expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
          );
        }
      }
    }
  }

  // Vehicle year sanity
  if (data.vehicleYear && data.vehicleYear > currentYear + 1) {
    errors.push("Vehicle year is in the future");
  }
  if (data.vehicleYear && data.vehicleYear < 1970) {
    errors.push("Vehicle year appears invalid (before 1970)");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    plateFormatValid,
    vehicleAgeAcceptable,
    ownerNameMatch,
  };
}

// ---------------------------------------------------------------------------
// Generic document validator dispatcher
// ---------------------------------------------------------------------------

/**
 * Validate any document type by dispatching to the appropriate validator.
 * Returns a normalized result with valid, errors, and warnings.
 */
export function validateDocument(
  type: DocumentType,
  data: unknown,
): { valid: boolean; errors: string[]; warnings: string[] } {
  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: ["Document data is required and must be an object"],
      warnings: [],
    };
  }

  try {
    switch (type) {
      case "cnie": {
        const result = validateCNIE(data as CNIEData);
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      case "driving_license": {
        const result = validateDrivingLicense(data as LicenseData);
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      case "insurance": {
        const result = validateInsurance(data as InsuranceData);
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      case "auto_entrepreneur": {
        const result = validateAutoEntrepreneur(
          data as AutoEntrepreneurData,
        );
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      case "vehicle_inspection": {
        const result = validateVehicleInspection(
          data as VehicleInspectionData,
        );
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      case "medical_certificate": {
        const result = validateMedicalCertificate(
          data as MedicalCertificateData,
        );
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      case "casier_judiciaire": {
        const result = validateCasierJudiciaire(
          data as CasierJudiciaireData,
        );
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      case "selfie_verification": {
        const result = validateSelfieWithCNIE(
          data as SelfieVerificationData,
        );
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      case "vehicle_registration": {
        const result = validateVehicleRegistration(
          data as VehicleRegistrationData,
        );
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        };
      }
      default: {
        return {
          valid: false,
          errors: [`Unknown document type: ${type as string}`],
          warnings: [],
        };
      }
    }
  } catch (err) {
    logger.error("Document validation error", err, "driverVerification");
    return {
      valid: false,
      errors: [`Validation error: ${err instanceof Error ? err.message : String(err)}`],
      warnings: [],
    };
  }
}

// ---------------------------------------------------------------------------
// KYC Progress & Stage
// ---------------------------------------------------------------------------

/**
 * Calculate overall KYC progress for a driver.
 * Compares submitted/approved documents against required documents.
 */
export function calculateKYCProgress(
  documents: DriverDocument[],
  vehicleType?: VehicleType,
): KYCProgress {
  const required = getRequiredDocuments(vehicleType ?? "car");
  const driverId = documents.length > 0 ? documents[0]!.driverId : "";

  const submittedTypes = new Set(documents.map((d) => d.type));
  const approvedDocs = documents.filter((d) => d.status === "approved");
  const rejectedDocs = documents.filter((d) => d.status === "rejected");
  const expiredDocs = documents.filter((d) => d.status === "expired");
  const pendingDocs = documents.filter((d) => d.status === "pending");

  const approvedTypes = new Set(approvedDocs.map((d) => d.type));
  const rejectedTypes = new Set(rejectedDocs.map((d) => d.type));
  const expiredTypes = new Set(expiredDocs.map((d) => d.type));
  const pendingTypes = new Set(pendingDocs.map((d) => d.type));

  const missingDocuments = required.filter((t) => !submittedTypes.has(t));
  const expiredDocuments = required.filter((t) => expiredTypes.has(t));
  const rejectedDocuments = required.filter((t) => rejectedTypes.has(t));
  const pendingDocuments2 = required.filter((t) => pendingTypes.has(t));
  const approvedDocuments = required.filter((t) => approvedTypes.has(t));

  const totalRequired = required.length;
  const totalApproved = approvedDocuments.length;
  const completionPercentage =
    totalRequired > 0
      ? Math.round((totalApproved / totalRequired) * 100)
      : 0;

  return {
    driverId,
    totalRequired,
    totalSubmitted: required.filter((t) => submittedTypes.has(t)).length,
    totalApproved,
    totalRejected: rejectedDocuments.length,
    totalExpired: expiredDocuments.length,
    totalPending: pendingDocuments2.length,
    completionPercentage,
    missingDocuments,
    expiredDocuments,
    rejectedDocuments,
    pendingDocuments: pendingDocuments2,
    approvedDocuments,
    isComplete: totalApproved === totalRequired && missingDocuments.length === 0,
  };
}

/**
 * Check document expiry dates and generate alerts.
 * Alerts at 30, 15, 7, and 1 day(s) before expiry.
 */
export function checkDocumentExpiry(
  documents: DriverDocument[],
  referenceDate?: number,
): ExpiryAlert[] {
  const refDate = referenceDate ?? nowTimestamp();
  const alerts: ExpiryAlert[] = [];

  for (const doc of documents) {
    if (!doc.expiryDate) continue;
    if (doc.status === "rejected") continue;

    const expiryTs = parseDate(doc.expiryDate);
    if (isNaN(expiryTs)) continue;

    const daysUntilExpiry = daysBetween(refDate, expiryTs);

    // Already expired
    if (daysUntilExpiry < 0) {
      alerts.push({
        documentType: doc.type,
        driverId: doc.driverId,
        expiryDate: doc.expiryDate,
        daysUntilExpiry,
        severity: "critical",
        message: `${formatDocumentTypeName(doc.type)} expired ${Math.abs(daysUntilExpiry)} day(s) ago`,
      });
      continue;
    }

    // Check each alert threshold
    for (const threshold of EXPIRY_ALERT_DAYS) {
      if (daysUntilExpiry <= threshold) {
        alerts.push({
          documentType: doc.type,
          driverId: doc.driverId,
          expiryDate: doc.expiryDate,
          daysUntilExpiry,
          severity: expiryDaysToSeverity(daysUntilExpiry),
          message:
            daysUntilExpiry === 0
              ? `${formatDocumentTypeName(doc.type)} expires today`
              : `${formatDocumentTypeName(doc.type)} expires in ${daysUntilExpiry} day(s)`,
        });
        break; // Only one alert per document (most urgent)
      }
    }
  }

  // Sort by severity (critical first) then by days until expiry
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  alerts.sort((a, b) => {
    const severityDiff =
      severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });

  return alerts;
}

/**
 * Determine the current verification stage based on KYC progress.
 */
export function determineVerificationStage(
  progress: KYCProgress,
): VerificationStage {
  const requiredActions: string[] = [];

  // No documents submitted
  if (progress.totalSubmitted === 0) {
    for (const docType of progress.missingDocuments) {
      requiredActions.push(`Submit ${formatDocumentTypeName(docType)}`);
    }
    return {
      stage: "initial",
      reason: "No documents have been submitted yet",
      canOperate: false,
      requiredActions,
    };
  }

  // All approved and complete
  if (progress.isComplete) {
    // Check for expired documents
    if (progress.totalExpired > 0) {
      for (const docType of progress.expiredDocuments) {
        requiredActions.push(`Renew expired ${formatDocumentTypeName(docType)}`);
      }
      return {
        stage: "re_verification",
        reason: `${progress.totalExpired} document(s) have expired and need renewal`,
        canOperate: false,
        requiredActions,
      };
    }

    return {
      stage: "approved",
      reason: "All required documents are approved",
      canOperate: true,
      requiredActions: [],
    };
  }

  // Has rejections
  if (progress.totalRejected > 0) {
    for (const docType of progress.rejectedDocuments) {
      requiredActions.push(
        `Re-submit rejected ${formatDocumentTypeName(docType)}`,
      );
    }

    // If all submitted but some rejected
    if (progress.missingDocuments.length === 0) {
      return {
        stage: "rejected",
        reason: `${progress.totalRejected} document(s) rejected. Please re-submit`,
        canOperate: false,
        requiredActions,
      };
    }
  }

  // Has expired documents
  if (progress.totalExpired > 0) {
    for (const docType of progress.expiredDocuments) {
      requiredActions.push(`Renew expired ${formatDocumentTypeName(docType)}`);
    }
  }

  // Has pending documents
  if (progress.totalPending > 0) {
    // Some submitted, some pending review
    if (progress.missingDocuments.length === 0) {
      return {
        stage: "under_review",
        reason: `${progress.totalPending} document(s) pending review`,
        canOperate: false,
        requiredActions:
          requiredActions.length > 0
            ? requiredActions
            : ["Wait for document review to complete"],
      };
    }
  }

  // Missing documents
  if (progress.missingDocuments.length > 0) {
    for (const docType of progress.missingDocuments) {
      requiredActions.push(`Submit ${formatDocumentTypeName(docType)}`);
    }
    return {
      stage: "documents_submitted",
      reason: `${progress.missingDocuments.length} required document(s) still missing`,
      canOperate: false,
      requiredActions,
    };
  }

  // Fallback: some combination of states
  return {
    stage: "under_review",
    reason: "Documents are being processed",
    canOperate: false,
    requiredActions:
      requiredActions.length > 0
        ? requiredActions
        : ["Wait for document review to complete"],
  };
}

/**
 * Schedule re-verification for documents approaching expiry.
 */
export function scheduleReVerification(
  documents: DriverDocument[],
  referenceDate?: number,
): ReVerificationSchedule {
  const refDate = referenceDate ?? nowTimestamp();
  const driverId = documents.length > 0 ? documents[0]!.driverId : "";

  const documentsToRenew: DocumentType[] = [];
  const urgentRenewals: DocumentType[] = [];
  const scheduledChecks: Array<{
    documentType: DocumentType;
    checkDate: string;
    reason: string;
  }> = [];

  let earliestRenewalTs = Infinity;

  for (const doc of documents) {
    if (!doc.expiryDate) continue;

    const expiryTs = parseDate(doc.expiryDate);
    if (isNaN(expiryTs)) continue;

    const daysUntilExpiry = daysBetween(refDate, expiryTs);

    if (daysUntilExpiry < 0) {
      // Already expired
      documentsToRenew.push(doc.type);
      urgentRenewals.push(doc.type);
    } else if (daysUntilExpiry <= 30) {
      // Expiring within 30 days
      documentsToRenew.push(doc.type);
      if (daysUntilExpiry <= 7) {
        urgentRenewals.push(doc.type);
      }
    }

    // Schedule a check 30 days before expiry
    if (daysUntilExpiry > 30) {
      const checkTs = expiryTs - 30 * MS_PER_DAY;
      if (checkTs < earliestRenewalTs) {
        earliestRenewalTs = checkTs;
      }
      scheduledChecks.push({
        documentType: doc.type,
        checkDate: new Date(checkTs).toISOString(),
        reason: `${formatDocumentTypeName(doc.type)} expires on ${doc.expiryDate}`,
      });
    }

    // For Casier Judiciaire, schedule re-check every 3 months
    if (doc.type === "casier_judiciaire" && doc.submittedAt) {
      const submittedTs = parseDate(doc.submittedAt);
      if (!isNaN(submittedTs)) {
        const nextCheckTs =
          submittedTs + CASIER_VALIDITY_MONTHS * 30.44 * MS_PER_DAY;
        if (nextCheckTs > refDate && nextCheckTs < earliestRenewalTs) {
          earliestRenewalTs = nextCheckTs;
        }
        scheduledChecks.push({
          documentType: doc.type,
          checkDate: new Date(nextCheckTs).toISOString(),
          reason: `Casier Judiciaire requires renewal every ${CASIER_VALIDITY_MONTHS} months`,
        });
      }
    }
  }

  // Sort scheduled checks by date
  scheduledChecks.sort(
    (a, b) => parseDate(a.checkDate) - parseDate(b.checkDate),
  );

  // Next verification date is the earliest scheduled check or 30 days from now
  const nextVerificationDate =
    earliestRenewalTs < Infinity
      ? new Date(earliestRenewalTs).toISOString()
      : new Date(refDate + 30 * MS_PER_DAY).toISOString();

  return {
    driverId,
    nextVerificationDate,
    documentsToRenew,
    urgentRenewals,
    scheduledChecks,
  };
}

/**
 * Check if a driver is eligible to operate based on KYC progress.
 */
export function isDriverEligible(progress: KYCProgress): boolean {
  return (
    progress.isComplete &&
    progress.totalRejected === 0 &&
    progress.totalExpired === 0 &&
    progress.completionPercentage === 100
  );
}

// ---------------------------------------------------------------------------
// KYC Assessment Pipeline
// ---------------------------------------------------------------------------

/**
 * Run a full KYC assessment for a single driver.
 * Validates all documents, calculates progress, determines stage, and generates alerts.
 */
export function runKYCAssessment(profile: DriverProfile): KYCResult {
  const refDate = nowTimestamp();
  const notes: string[] = [];

  logger.info(
    `Running KYC assessment for driver ${profile.driverId}`,
    "driverVerification",
  );

  // 1. Calculate progress
  const progress = calculateKYCProgress(
    profile.documents,
    profile.vehicleType,
  );

  // 2. Validate each submitted document
  for (const doc of profile.documents) {
    if (doc.status === "rejected") continue;

    const validationResult = validateDocument(doc.type, doc.documentData);
    if (!validationResult.valid) {
      notes.push(
        `${formatDocumentTypeName(doc.type)}: ${validationResult.errors.join("; ")}`,
      );
    }
    if (validationResult.warnings.length > 0) {
      notes.push(
        `${formatDocumentTypeName(doc.type)} warnings: ${validationResult.warnings.join("; ")}`,
      );
    }
  }

  // 3. Check document expiry
  const expiryAlerts = checkDocumentExpiry(profile.documents, refDate);
  for (const alert of expiryAlerts) {
    if (alert.severity === "critical" || alert.severity === "high") {
      notes.push(alert.message);
    }
  }

  // 4. Determine verification stage
  const stage = determineVerificationStage(progress);

  // 5. Schedule re-verification
  const reVerificationSchedule = scheduleReVerification(
    profile.documents,
    refDate,
  );

  // 6. Determine eligibility
  const eligible = isDriverEligible(progress);

  // 7. Calculate overall risk
  const overallRisk = calculateOverallRisk(
    progress,
    expiryAlerts,
    stage,
  );

  // 8. Additional notes
  if (progress.missingDocuments.length > 0) {
    notes.push(
      `Missing documents: ${progress.missingDocuments.map(formatDocumentTypeName).join(", ")}`,
    );
  }
  if (reVerificationSchedule.urgentRenewals.length > 0) {
    notes.push(
      `Urgent renewals needed: ${reVerificationSchedule.urgentRenewals.map(formatDocumentTypeName).join(", ")}`,
    );
  }

  return {
    driverId: profile.driverId,
    stage,
    progress,
    expiryAlerts,
    reVerificationSchedule,
    eligible,
    overallRisk,
    notes,
    assessedAt: new Date(refDate).toISOString(),
  };
}

/**
 * Calculate overall risk level from progress, alerts, and stage.
 */
function calculateOverallRisk(
  progress: KYCProgress,
  alerts: ExpiryAlert[],
  stage: VerificationStage,
): AlertSeverity {
  // Critical: rejected or expired documents
  if (progress.totalRejected > 0 || progress.totalExpired > 0) {
    return "critical";
  }

  // High: missing documents or critical alerts
  if (
    progress.missingDocuments.length > 0 ||
    alerts.some((a) => a.severity === "critical")
  ) {
    return "high";
  }

  // Medium: pending review or high-severity alerts
  if (
    stage.stage === "under_review" ||
    alerts.some((a) => a.severity === "high")
  ) {
    return "medium";
  }

  // Low: everything is fine or minor alerts
  if (alerts.some((a) => a.severity === "medium")) {
    return "medium";
  }

  return "low";
}

/**
 * Generate re-verification tasks for a driver's documents.
 * Returns a list of actionable tasks with priorities and due dates.
 */
export function generateReVerificationTasks(
  documents: DriverDocument[],
): ReVerificationTask[] {
  const refDate = nowTimestamp();
  const tasks: ReVerificationTask[] = [];
  const driverId = documents.length > 0 ? documents[0]!.driverId : "";

  for (const doc of documents) {
    // Rejected documents: re-upload task
    if (doc.status === "rejected") {
      tasks.push({
        driverId,
        documentType: doc.type,
        taskType: "re_upload",
        priority: "high",
        dueDate: new Date(refDate + 7 * MS_PER_DAY).toISOString(),
        description: `Re-upload rejected ${formatDocumentTypeName(doc.type)}${doc.rejectionReason ? `: ${doc.rejectionReason}` : ""}`,
      });
      continue;
    }

    // Expired documents: renewal task
    if (doc.status === "expired" || (doc.expiryDate && isExpired(doc.expiryDate, refDate))) {
      tasks.push({
        driverId,
        documentType: doc.type,
        taskType: "renewal",
        priority: "critical",
        dueDate: new Date(refDate).toISOString(),
        description: `Renew expired ${formatDocumentTypeName(doc.type)}. Document expired on ${doc.expiryDate ?? "unknown date"}`,
      });
      continue;
    }

    // Approaching expiry: expiry_check task
    if (doc.expiryDate) {
      const expiryTs = parseDate(doc.expiryDate);
      if (!isNaN(expiryTs)) {
        const daysLeft = daysBetween(refDate, expiryTs);

        if (daysLeft <= 7) {
          tasks.push({
            driverId,
            documentType: doc.type,
            taskType: "renewal",
            priority: "high",
            dueDate: doc.expiryDate,
            description: `${formatDocumentTypeName(doc.type)} expires in ${daysLeft} day(s). Begin renewal process immediately`,
          });
        } else if (daysLeft <= 30) {
          tasks.push({
            driverId,
            documentType: doc.type,
            taskType: "expiry_check",
            priority: "medium",
            dueDate: new Date(expiryTs - 14 * MS_PER_DAY).toISOString(),
            description: `${formatDocumentTypeName(doc.type)} expires in ${daysLeft} day(s). Plan renewal`,
          });
        }
      }
    }

    // Casier Judiciaire: periodic re-verification
    if (doc.type === "casier_judiciaire" && doc.submittedAt) {
      const submittedTs = parseDate(doc.submittedAt);
      if (!isNaN(submittedTs)) {
        const monthsSinceSubmission =
          (refDate - submittedTs) / (MS_PER_DAY * 30.44);
        if (monthsSinceSubmission >= CASIER_VALIDITY_MONTHS - 1) {
          tasks.push({
            driverId,
            documentType: doc.type,
            taskType: "re_verify",
            priority:
              monthsSinceSubmission >= CASIER_VALIDITY_MONTHS
                ? "critical"
                : "medium",
            dueDate: addMonthsToDate(
              doc.submittedAt,
              CASIER_VALIDITY_MONTHS,
            ),
            description: `Casier Judiciaire is ${Math.round(monthsSinceSubmission)} months old. Must be renewed every ${CASIER_VALIDITY_MONTHS} months`,
          });
        }
      }
    }
  }

  // Sort by priority
  const priorityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  tasks.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  return tasks;
}

// ---------------------------------------------------------------------------
// Batch & Fleet Operations
// ---------------------------------------------------------------------------

/**
 * Run KYC assessment on multiple driver profiles.
 * Returns a map of driverId to KYCResult.
 */
export function batchKYCAssessment(
  profiles: DriverProfile[],
): Map<string, KYCResult> {
  const results = new Map<string, KYCResult>();

  logger.info(
    `Running batch KYC assessment for ${profiles.length} driver(s)`,
    "driverVerification",
  );

  for (const profile of profiles) {
    try {
      const result = runKYCAssessment(profile);
      results.set(profile.driverId, result);
    } catch (err) {
      logger.error(
        `KYC assessment failed for driver ${profile.driverId}`,
        err,
        "driverVerification",
      );
      // Create a failed result
      const failedProgress = calculateKYCProgress(
        profile.documents,
        profile.vehicleType,
      );
      results.set(profile.driverId, {
        driverId: profile.driverId,
        stage: {
          stage: "suspended",
          reason: `Assessment error: ${err instanceof Error ? err.message : String(err)}`,
          canOperate: false,
          requiredActions: ["Contact support for manual review"],
        },
        progress: failedProgress,
        expiryAlerts: [],
        reVerificationSchedule: {
          driverId: profile.driverId,
          nextVerificationDate: new Date().toISOString(),
          documentsToRenew: [],
          urgentRenewals: [],
          scheduledChecks: [],
        },
        eligible: false,
        overallRisk: "critical",
        notes: [
          `Assessment failed: ${err instanceof Error ? err.message : String(err)}`,
        ],
        assessedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

/**
 * Calculate fleet-wide KYC statistics from assessment results.
 */
export function getFleetKYCStats(results: KYCResult[]): FleetKYCStats {
  const totalDrivers = results.length;

  if (totalDrivers === 0) {
    return {
      totalDrivers: 0,
      fullyCompliant: 0,
      partiallyCompliant: 0,
      nonCompliant: 0,
      complianceRate: 0,
      averageCompletion: 0,
      documentsByStatus: { pending: 0, approved: 0, rejected: 0, expired: 0 },
      expiringWithin30Days: 0,
      expiringWithin7Days: 0,
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      mostCommonMissing: [],
    };
  }

  let fullyCompliant = 0;
  let partiallyCompliant = 0;
  let nonCompliant = 0;
  let totalCompletion = 0;

  const docStatusCounts: Record<DocumentStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  };

  let expiring30 = 0;
  let expiring7 = 0;

  const riskDist: Record<AlertSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const missingCounts = new Map<DocumentType, number>();

  for (const result of results) {
    // Compliance classification
    if (result.eligible && result.progress.isComplete) {
      fullyCompliant++;
    } else if (result.progress.completionPercentage >= 50) {
      partiallyCompliant++;
    } else {
      nonCompliant++;
    }

    totalCompletion += result.progress.completionPercentage;

    // Document status counts
    docStatusCounts.pending += result.progress.totalPending;
    docStatusCounts.approved += result.progress.totalApproved;
    docStatusCounts.rejected += result.progress.totalRejected;
    docStatusCounts.expired += result.progress.totalExpired;

    // Expiry alerts
    for (const alert of result.expiryAlerts) {
      if (alert.daysUntilExpiry >= 0 && alert.daysUntilExpiry <= 30) {
        expiring30++;
      }
      if (alert.daysUntilExpiry >= 0 && alert.daysUntilExpiry <= 7) {
        expiring7++;
      }
    }

    // Risk distribution
    riskDist[result.overallRisk]++;

    // Missing documents
    for (const missing of result.progress.missingDocuments) {
      missingCounts.set(missing, (missingCounts.get(missing) ?? 0) + 1);
    }
  }

  // Sort missing documents by count (most common first)
  const mostCommonMissing = Array.from(missingCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalDrivers,
    fullyCompliant,
    partiallyCompliant,
    nonCompliant,
    complianceRate:
      totalDrivers > 0
        ? Math.round((fullyCompliant / totalDrivers) * 100)
        : 0,
    averageCompletion:
      totalDrivers > 0
        ? Math.round(totalCompletion / totalDrivers)
        : 0,
    documentsByStatus: docStatusCounts,
    expiringWithin30Days: expiring30,
    expiringWithin7Days: expiring7,
    riskDistribution: riskDist,
    mostCommonMissing,
  };
}

// ---------------------------------------------------------------------------
// Compliance Check
// ---------------------------------------------------------------------------

/**
 * Check overall document compliance for a set of driver documents.
 * Returns a compliance score and detailed per-document status.
 */
export function checkDocumentCompliance(
  documents: DriverDocument[],
  vehicleType?: VehicleType,
): ComplianceResult {
  const required = getRequiredDocuments(vehicleType ?? "car");
  const issues: string[] = [];
  const warnings: string[] = [];
  const details: ComplianceResult["details"] = [];

  const documentsByType = new Map<DocumentType, DriverDocument>();
  for (const doc of documents) {
    // Keep the most recent document per type
    const existing = documentsByType.get(doc.type);
    if (
      !existing ||
      parseDate(doc.submittedAt) > parseDate(existing.submittedAt)
    ) {
      documentsByType.set(doc.type, doc);
    }
  }

  let compliantCount = 0;

  for (const docType of required) {
    const doc = documentsByType.get(docType);

    if (!doc) {
      issues.push(`Missing required document: ${formatDocumentTypeName(docType)}`);
      details.push({
        documentType: docType,
        status: "pending",
        compliant: false,
        issue: "Document not submitted",
      });
      continue;
    }

    const isCompliant = doc.status === "approved";

    if (doc.status === "rejected") {
      issues.push(
        `${formatDocumentTypeName(docType)} was rejected${doc.rejectionReason ? `: ${doc.rejectionReason}` : ""}`,
      );
    } else if (doc.status === "expired") {
      issues.push(`${formatDocumentTypeName(docType)} has expired`);
    } else if (doc.status === "pending") {
      warnings.push(
        `${formatDocumentTypeName(docType)} is pending review`,
      );
    }

    // Validate the document data
    if (doc.documentData && doc.status !== "rejected") {
      const validation = validateDocument(docType, doc.documentData);
      if (!validation.valid) {
        for (const err of validation.errors) {
          issues.push(`${formatDocumentTypeName(docType)}: ${err}`);
        }
      }
      for (const warn of validation.warnings) {
        warnings.push(`${formatDocumentTypeName(docType)}: ${warn}`);
      }
    }

    if (isCompliant) {
      compliantCount++;
    }

    details.push({
      documentType: docType,
      status: doc.status,
      compliant: isCompliant,
      issue: isCompliant
        ? undefined
        : doc.status === "rejected"
          ? doc.rejectionReason ?? "Rejected"
          : doc.status === "expired"
            ? "Expired"
            : doc.status === "pending"
              ? "Pending review"
              : "Unknown issue",
    });
  }

  const score =
    required.length > 0
      ? Math.round((compliantCount / required.length) * 100)
      : 0;

  return {
    isCompliant: issues.length === 0 && compliantCount === required.length,
    issues,
    warnings,
    score,
    details,
  };
}

// ---------------------------------------------------------------------------
// Utility exports
// ---------------------------------------------------------------------------

/**
 * Get human-readable name for a document type.
 */
export function formatDocumentTypeName(type: DocumentType): string {
  return DOCUMENT_TYPE_NAMES[type] ?? type;
}
