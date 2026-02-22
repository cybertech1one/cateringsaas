"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import {
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Bike,
  Car,
  Truck,
  Footprints,
  Upload,
  Pencil,
  Save,
  AlertCircle,
  Check,
} from "lucide-react";
import { MOROCCO_CITIES } from "~/data/moroccoCities";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VehicleType = "bicycle" | "motorcycle" | "car" | "van" | "on_foot";

type AvailabilitySlot = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

type WizardData = {
  // Step 1: Personal
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  city: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  // Step 2: Vehicle
  vehicleType: VehicleType | "";
  plateNumber: string;
  vehicleMake: string;
  insuranceExpiry: string;
  // Step 3: Documents
  nationalIdType: "cnie" | "passport" | "";
  idNumber: string;
  idExpiry: string;
  documents: { type: string; url: string; name: string }[];
  // Step 4: Legal
  termsOfService: boolean;
  privacyPolicy: boolean;
  cashHandling: boolean;
  backgroundCheck: boolean;
  ageConfirmation: boolean;
  independentContractor: boolean;
  // Step 5: Availability
  availabilitySlots: AvailabilitySlot[];
  maxDistance: string;
};

type StepErrors = Record<string, string>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 6;
const STORAGE_KEY = "feastqr-driver-registration-draft";

const VEHICLE_OPTIONS: {
  value: VehicleType;
  icon: typeof Bike;
  labelKey: string;
  descKey: string;
  motorized: boolean;
}[] = [
  {
    value: "bicycle",
    icon: Bike,
    labelKey: "driverRegistration.vehicleBicycle",
    descKey: "driverRegistration.vehicleBicycleDesc",
    motorized: false,
  },
  {
    value: "motorcycle",
    icon: Bike,
    labelKey: "driverRegistration.vehicleMotorcycle",
    descKey: "driverRegistration.vehicleMotorcycleDesc",
    motorized: true,
  },
  {
    value: "car",
    icon: Car,
    labelKey: "driverRegistration.vehicleCar",
    descKey: "driverRegistration.vehicleCarDesc",
    motorized: true,
  },
  {
    value: "van",
    icon: Truck,
    labelKey: "driverRegistration.vehicleVan",
    descKey: "driverRegistration.vehicleVanDesc",
    motorized: true,
  },
  {
    value: "on_foot",
    icon: Footprints,
    labelKey: "driverRegistration.vehicleOnFoot",
    descKey: "driverRegistration.vehicleOnFootDesc",
    motorized: false,
  },
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DISTANCE_OPTIONS = ["3", "5", "10", "15", "20", "30"];

const INITIAL_DATA: WizardData = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  city: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  vehicleType: "",
  plateNumber: "",
  vehicleMake: "",
  insuranceExpiry: "",
  nationalIdType: "",
  idNumber: "",
  idExpiry: "",
  documents: [],
  termsOfService: false,
  privacyPolicy: false,
  cashHandling: false,
  backgroundCheck: false,
  ageConfirmation: false,
  independentContractor: false,
  availabilitySlots: [],
  maxDistance: "10",
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function isMotorized(vehicleType: string): boolean {
  return ["motorcycle", "car", "van"].includes(vehicleType);
}

function isAtLeast18(dateOfBirth: string): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age >= 18;
}

function isValidMoroccanPhone(phone: string): boolean {
  return /^\+212[5-7]\d{8}$/.test(phone.replace(/\s/g, ""));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DriverRegistrationForm = () => {
  const { t: rawT } = useTranslation();
  const t = rawT as (key: string, opts?: Record<string, unknown>) => string;
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Phone availability check
  const [phoneCheckResult, setPhoneCheckResult] = useState<
    "available" | "taken" | "checking" | null
  >(null);

  const phoneCheckQuery = api.drivers.checkPhoneAvailable.useQuery(
    { phone: data.phone.replace(/\s/g, "") },
    {
      enabled: false,
    },
  );

  // Registration mutation
  const registerMutation = api.drivers.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      // Clear draft on success
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
      toast({
        title: t("driverRegistration.successTitle"),
        description: t("driverRegistration.successMessage"),
      });
    },
    onError: (error) => {
      const message = error.message;

      if (message.includes("phone number already exists")) {
        toast({
          title: t("driverRegistration.errorDuplicate"),
          variant: "destructive",
        });
      } else if (message.includes("Too many")) {
        toast({
          title: t("driverRegistration.errorRateLimit"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("driverRegistration.errorGeneric"),
          variant: "destructive",
        });
      }
    },
  });

  // ---------------------------------------------------------------------------
  // Draft persistence
  // ---------------------------------------------------------------------------

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as Partial<WizardData>;

        setData((prev) => ({ ...prev, ...parsed }));
        setDraftRestored(true);
        toast({
          title: t("driverRegistration.draftRestored"),
        });
      }
    } catch {
      // Ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft on data change (debounced)
  useEffect(() => {
    if (submitted) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Ignore storage errors
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [data, submitted]);

  // ---------------------------------------------------------------------------
  // Phone availability check (debounced)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const cleanPhone = data.phone.replace(/\s/g, "");

    if (!isValidMoroccanPhone(cleanPhone)) {
      setPhoneCheckResult(null);

      return;
    }

    setPhoneCheckResult("checking");
    const timer = setTimeout(() => {
      phoneCheckQuery
        .refetch()
        .then((result) => {
          if (result.data) {
            setPhoneCheckResult(
              result.data.available ? "available" : "taken",
            );
          }
        })
        .catch(() => {
          setPhoneCheckResult(null);
        });
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.phone]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateStep = useCallback(
    (step: number): StepErrors => {
      const newErrors: StepErrors = {};

      if (step === 1) {
        if (!data.fullName.trim()) {
          newErrors.fullName = t("driverRegistration.required");
        }

        const cleanPhone = data.phone.replace(/\s/g, "");

        if (!cleanPhone) {
          newErrors.phone = t("driverRegistration.required");
        } else if (!isValidMoroccanPhone(cleanPhone)) {
          newErrors.phone = t("driverRegistration.invalidPhone");
        } else if (phoneCheckResult === "taken") {
          newErrors.phone = t("driverRegistration.phoneAlreadyRegistered");
        }

        if (
          data.email.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        ) {
          newErrors.email = t("driverRegistration.invalidEmail");
        }

        if (!data.dateOfBirth) {
          newErrors.dateOfBirth = t("driverRegistration.required");
        } else if (!isAtLeast18(data.dateOfBirth)) {
          newErrors.dateOfBirth = t("driverRegistration.mustBe18");
        }

        if (!data.city) {
          newErrors.city = t("driverRegistration.required");
        }

        if (!data.emergencyContactName.trim()) {
          newErrors.emergencyContactName = t("driverRegistration.required");
        }

        if (!data.emergencyContactPhone.trim()) {
          newErrors.emergencyContactPhone = t("driverRegistration.required");
        }
      }

      if (step === 2) {
        if (!data.vehicleType) {
          newErrors.vehicleType = t("driverRegistration.required");
        }

        if (isMotorized(data.vehicleType)) {
          if (!data.plateNumber.trim()) {
            newErrors.plateNumber = t("driverRegistration.required");
          }

          if (!data.vehicleMake.trim()) {
            newErrors.vehicleMake = t("driverRegistration.required");
          }

          if (
            data.vehicleType !== "van" &&
            data.insuranceExpiry &&
            new Date(data.insuranceExpiry) < new Date()
          ) {
            newErrors.insuranceExpiry = t(
              "driverRegistration.insuranceExpired",
            );
          }
        }
      }

      if (step === 3) {
        if (!data.nationalIdType) {
          newErrors.nationalIdType = t("driverRegistration.required");
        }

        if (!data.idNumber.trim()) {
          newErrors.idNumber = t("driverRegistration.required");
        }

        if (!data.idExpiry) {
          newErrors.idExpiry = t("driverRegistration.required");
        } else if (new Date(data.idExpiry) < new Date()) {
          newErrors.idExpiry = t("driverRegistration.idExpired");
        }
      }

      if (step === 4) {
        if (
          !data.termsOfService ||
          !data.privacyPolicy ||
          !data.cashHandling ||
          !data.backgroundCheck ||
          !data.ageConfirmation ||
          !data.independentContractor
        ) {
          newErrors.agreements = t(
            "driverRegistration.allAgreementsRequired",
          );
        }

        if (data.ageConfirmation && data.dateOfBirth && !isAtLeast18(data.dateOfBirth)) {
          newErrors.ageConfirmation = t("driverRegistration.ageError");
        }
      }

      return newErrors;
    },
    [data, phoneCheckResult, t],
  );

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goToStep = useCallback(
    (step: number) => {
      if (step < 1 || step > TOTAL_STEPS) return;

      // Validate current step before advancing
      if (step > currentStep) {
        const stepErrors = validateStep(currentStep);

        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);

          return;
        }
      }

      setErrors({});
      setCurrentStep(step);
    },
    [currentStep, validateStep],
  );

  const handleNext = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const handlePrevious = useCallback(() => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  // ---------------------------------------------------------------------------
  // Data setters
  // ---------------------------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof WizardData>(field: K, value: WizardData[K]) => {
      setData((prev) => ({ ...prev, [field]: value }));

      if (errors[field as string]) {
        setErrors((prev) => {
          const next = { ...prev };

          delete next[field as string];

          return next;
        });
      }
    },
    [errors],
  );

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(() => {
    // Validate all steps
    for (let step = 1; step <= 5; step++) {
      const stepErrors = validateStep(step);

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setCurrentStep(step);

        return;
      }
    }

    registerMutation.mutate({
      fullName: data.fullName.trim(),
      phone: data.phone.replace(/\s/g, ""),
      email: data.email.trim() || undefined,
      city: data.city,
      vehicleType: data.vehicleType as VehicleType,
      licenseNumber: data.plateNumber.trim() || undefined,
      idNumber: data.idNumber.trim() || undefined,
    });
  }, [data, validateStep, registerMutation]);

  // ---------------------------------------------------------------------------
  // Step info
  // ---------------------------------------------------------------------------

  const stepInfo = useMemo(
    () => [
      {
        title: t("driverRegistration.step1Title"),
        desc: t("driverRegistration.step1Desc"),
      },
      {
        title: t("driverRegistration.step2Title"),
        desc: t("driverRegistration.step2Desc"),
      },
      {
        title: t("driverRegistration.step3Title"),
        desc: t("driverRegistration.step3Desc"),
      },
      {
        title: t("driverRegistration.step4Title"),
        desc: t("driverRegistration.step4Desc"),
      },
      {
        title: t("driverRegistration.step5Title"),
        desc: t("driverRegistration.step5Desc"),
      },
      {
        title: t("driverRegistration.step6Title"),
        desc: t("driverRegistration.step6Desc"),
      },
    ],
    [t],
  );

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="mb-3 font-display text-2xl font-bold text-foreground">
          {t("driverRegistration.successTitle")}
        </h3>
        <p className="max-w-md text-muted-foreground">
          {t("driverRegistration.successMessage")}
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl">
      {/* Draft restored notice */}
      {draftRestored && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
          role="status"
        >
          <Save className="h-4 w-4 shrink-0" />
          {t("driverRegistration.draftRestored")}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {stepInfo[currentStep - 1]?.title}
          </span>
          <span className="text-muted-foreground">
            {t("driverRegistration.progressStep", {
              current: currentStep,
              total: TOTAL_STEPS,
            })}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < currentStep
                  ? "bg-ember"
                  : i === currentStep
                    ? "bg-ember/40"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {stepInfo[currentStep - 1]?.desc}
        </p>
      </div>

      {/* Step content */}
      <div className="space-y-6">
        {currentStep === 1 && (
          <Step1Personal
            data={data}
            errors={errors}
            phoneCheckResult={phoneCheckResult}
            updateField={updateField}
            t={t}
          />
        )}
        {currentStep === 2 && (
          <Step2Vehicle
            data={data}
            errors={errors}
            updateField={updateField}
            t={t}
          />
        )}
        {currentStep === 3 && (
          <Step3Documents
            data={data}
            errors={errors}
            updateField={updateField}
            t={t}
          />
        )}
        {currentStep === 4 && (
          <Step4Legal
            data={data}
            errors={errors}
            updateField={updateField}
            t={t}
          />
        )}
        {currentStep === 5 && (
          <Step5Availability
            data={data}
            errors={errors}
            updateField={updateField}
            t={t}
          />
        )}
        {currentStep === 6 && (
          <Step6Review data={data} goToStep={goToStep} t={t} />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="h-12 gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("driverRegistration.previous")}
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button
            type="button"
            onClick={handleNext}
            className="h-12 gap-2 bg-ember text-white shadow-lg shadow-ember/25 hover:shadow-xl hover:shadow-ember/30"
          >
            {t("driverRegistration.next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={registerMutation.isLoading}
            className="h-12 gap-2 bg-ember text-white shadow-lg shadow-ember/25 hover:shadow-xl hover:shadow-ember/30"
          >
            {registerMutation.isLoading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {registerMutation.isLoading
              ? t("driverRegistration.submitting")
              : t("driverRegistration.submit")}
          </Button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 1: Personal Information
// ---------------------------------------------------------------------------

function Step1Personal({
  data,
  errors,
  phoneCheckResult,
  updateField,
  t,
}: {
  data: WizardData;
  errors: StepErrors;
  phoneCheckResult: "available" | "taken" | "checking" | null;
  updateField: <K extends keyof WizardData>(
    field: K,
    value: WizardData[K],
  ) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="space-y-5">
      {/* Full Name */}
      <FieldWrapper
        label={t("driverRegistration.fullName")}
        htmlFor="reg-fullName"
        error={errors.fullName}
      >
        <Input
          id="reg-fullName"
          type="text"
          value={data.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
          placeholder={t("driverRegistration.fullNamePlaceholder")}
          aria-invalid={!!errors.fullName}
          className="h-12"
        />
      </FieldWrapper>

      {/* Phone */}
      <FieldWrapper
        label={t("driverRegistration.phone")}
        htmlFor="reg-phone"
        error={errors.phone}
        help={t("driverRegistration.phoneHelp")}
      >
        <div className="relative">
          <Input
            id="reg-phone"
            type="tel"
            value={data.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder={t("driverRegistration.phonePlaceholder")}
            aria-invalid={!!errors.phone}
            className="h-12 pr-10"
          />
          {phoneCheckResult === "checking" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {phoneCheckResult === "available" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Check className="h-4 w-4 text-emerald-500" />
            </div>
          )}
          {phoneCheckResult === "taken" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>
        {phoneCheckResult === "available" && !errors.phone && (
          <p className="text-xs text-emerald-600">
            {t("driverRegistration.phoneAvailable")}
          </p>
        )}
        {phoneCheckResult === "taken" && (
          <p className="text-xs text-destructive">
            {t("driverRegistration.phoneAlreadyRegistered")}
          </p>
        )}
      </FieldWrapper>

      {/* Email */}
      <FieldWrapper
        label={t("driverRegistration.email")}
        htmlFor="reg-email"
        error={errors.email}
        help={t("driverRegistration.emailHelp")}
      >
        <Input
          id="reg-email"
          type="email"
          value={data.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder={t("driverRegistration.emailPlaceholder")}
          aria-invalid={!!errors.email}
          className="h-12"
        />
      </FieldWrapper>

      {/* Date of Birth */}
      <FieldWrapper
        label={t("driverRegistration.dateOfBirth")}
        htmlFor="reg-dob"
        error={errors.dateOfBirth}
      >
        <Input
          id="reg-dob"
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => updateField("dateOfBirth", e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          aria-invalid={!!errors.dateOfBirth}
          className="h-12"
        />
      </FieldWrapper>

      {/* City */}
      <FieldWrapper
        label={t("driverRegistration.city")}
        htmlFor="reg-city"
        error={errors.city}
      >
        <Select
          value={data.city}
          onValueChange={(val) => updateField("city", val)}
        >
          <SelectTrigger
            id="reg-city"
            className="h-12"
            aria-invalid={!!errors.city}
          >
            <SelectValue
              placeholder={t("driverRegistration.cityPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            {MOROCCO_CITIES.map((city) => (
              <SelectItem key={city.slug} value={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>

      {/* Emergency Contact Name */}
      <FieldWrapper
        label={t("driverRegistration.emergencyContactName")}
        htmlFor="reg-emergency-name"
        error={errors.emergencyContactName}
      >
        <Input
          id="reg-emergency-name"
          type="text"
          value={data.emergencyContactName}
          onChange={(e) =>
            updateField("emergencyContactName", e.target.value)
          }
          placeholder={t(
            "driverRegistration.emergencyContactNamePlaceholder",
          )}
          aria-invalid={!!errors.emergencyContactName}
          className="h-12"
        />
      </FieldWrapper>

      {/* Emergency Contact Phone */}
      <FieldWrapper
        label={t("driverRegistration.emergencyContactPhone")}
        htmlFor="reg-emergency-phone"
        error={errors.emergencyContactPhone}
      >
        <Input
          id="reg-emergency-phone"
          type="tel"
          value={data.emergencyContactPhone}
          onChange={(e) =>
            updateField("emergencyContactPhone", e.target.value)
          }
          placeholder={t(
            "driverRegistration.emergencyContactPhonePlaceholder",
          )}
          aria-invalid={!!errors.emergencyContactPhone}
          className="h-12"
        />
      </FieldWrapper>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Vehicle Information
// ---------------------------------------------------------------------------

function Step2Vehicle({
  data,
  errors,
  updateField,
  t,
}: {
  data: WizardData;
  errors: StepErrors;
  updateField: <K extends keyof WizardData>(
    field: K,
    value: WizardData[K],
  ) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Vehicle Type Cards */}
      <div>
        <Label className="mb-3 block text-sm font-medium">
          {t("driverRegistration.vehicleType")}
        </Label>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("driverRegistration.vehicleTypeDesc")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {VEHICLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = data.vehicleType === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("vehicleType", opt.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                  isSelected
                    ? "border-ember bg-ember/5 shadow-md"
                    : "border-border hover:border-ember/40 hover:bg-muted/50"
                }`}
                aria-pressed={isSelected}
              >
                <Icon
                  className={`h-8 w-8 ${isSelected ? "text-ember" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-sm font-medium ${isSelected ? "text-ember" : "text-foreground"}`}
                >
                  {t(opt.labelKey)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(opt.descKey)}
                </span>
              </button>
            );
          })}
        </div>
        {errors.vehicleType && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {errors.vehicleType}
          </p>
        )}
      </div>

      {/* Conditional motorized fields */}
      {isMotorized(data.vehicleType) && (
        <div className="space-y-5 rounded-xl border border-border bg-muted/30 p-5">
          <FieldWrapper
            label={t("driverRegistration.plateNumber")}
            htmlFor="reg-plate"
            error={errors.plateNumber}
          >
            <Input
              id="reg-plate"
              type="text"
              value={data.plateNumber}
              onChange={(e) => updateField("plateNumber", e.target.value)}
              placeholder={t("driverRegistration.plateNumberPlaceholder")}
              aria-invalid={!!errors.plateNumber}
              className="h-12"
            />
          </FieldWrapper>

          <FieldWrapper
            label={t("driverRegistration.vehicleMake")}
            htmlFor="reg-make"
            error={errors.vehicleMake}
          >
            <Input
              id="reg-make"
              type="text"
              value={data.vehicleMake}
              onChange={(e) => updateField("vehicleMake", e.target.value)}
              placeholder={t("driverRegistration.vehicleMakePlaceholder")}
              aria-invalid={!!errors.vehicleMake}
              className="h-12"
            />
          </FieldWrapper>

          {(data.vehicleType === "motorcycle" ||
            data.vehicleType === "car") && (
            <FieldWrapper
              label={t("driverRegistration.insuranceExpiry")}
              htmlFor="reg-insurance"
              error={errors.insuranceExpiry}
              help={t("driverRegistration.insuranceExpiryHelp")}
            >
              <Input
                id="reg-insurance"
                type="date"
                value={data.insuranceExpiry}
                onChange={(e) =>
                  updateField("insuranceExpiry", e.target.value)
                }
                aria-invalid={!!errors.insuranceExpiry}
                className="h-12"
              />
            </FieldWrapper>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Identity & Documents
// ---------------------------------------------------------------------------

function Step3Documents({
  data,
  errors,
  updateField,
  t,
}: {
  data: WizardData;
  errors: StepErrors;
  updateField: <K extends keyof WizardData>(
    field: K,
    value: WizardData[K],
  ) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="space-y-5">
      {/* ID Type */}
      <FieldWrapper
        label={t("driverRegistration.nationalIdType")}
        htmlFor="reg-idtype"
        error={errors.nationalIdType}
      >
        <Select
          value={data.nationalIdType}
          onValueChange={(val) =>
            updateField("nationalIdType", val as "cnie" | "passport")
          }
        >
          <SelectTrigger
            id="reg-idtype"
            className="h-12"
            aria-invalid={!!errors.nationalIdType}
          >
            <SelectValue placeholder={t("driverRegistration.nationalIdType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cnie">
              {t("driverRegistration.nationalIdTypeCNIE")}
            </SelectItem>
            <SelectItem value="passport">
              {t("driverRegistration.nationalIdTypePassport")}
            </SelectItem>
          </SelectContent>
        </Select>
      </FieldWrapper>

      {/* ID Number */}
      <FieldWrapper
        label={t("driverRegistration.idNumber")}
        htmlFor="reg-idnumber"
        error={errors.idNumber}
      >
        <Input
          id="reg-idnumber"
          type="text"
          value={data.idNumber}
          onChange={(e) => updateField("idNumber", e.target.value)}
          placeholder={t("driverRegistration.idNumberPlaceholder")}
          aria-invalid={!!errors.idNumber}
          className="h-12"
        />
      </FieldWrapper>

      {/* ID Expiry */}
      <FieldWrapper
        label={t("driverRegistration.idExpiry")}
        htmlFor="reg-idexpiry"
        error={errors.idExpiry}
      >
        <Input
          id="reg-idexpiry"
          type="date"
          value={data.idExpiry}
          onChange={(e) => updateField("idExpiry", e.target.value)}
          aria-invalid={!!errors.idExpiry}
          className="h-12"
        />
      </FieldWrapper>

      {/* Document Upload Placeholders */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t("driverRegistration.adminDocuments")}
        </Label>
        <p className="text-xs text-muted-foreground">
          {t("driverRegistration.uploadInstructions")}
        </p>

        {data.nationalIdType === "cnie" && (
          <>
            <DocumentUploadSlot
              label={t("driverRegistration.uploadCnieFront")}
              uploaded={data.documents.some((d) => d.type === "cnie_front")}
            />
            <DocumentUploadSlot
              label={t("driverRegistration.uploadCnieBack")}
              uploaded={data.documents.some((d) => d.type === "cnie_back")}
            />
          </>
        )}

        {data.nationalIdType === "passport" && (
          <DocumentUploadSlot
            label={t("driverRegistration.uploadPassport")}
            uploaded={data.documents.some((d) => d.type === "passport")}
          />
        )}

        {isMotorized(data.vehicleType) && (
          <div>
            <DocumentUploadSlot
              label={t("driverRegistration.uploadDrivingLicense")}
              uploaded={data.documents.some(
                (d) => d.type === "driving_license",
              )}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("driverRegistration.uploadDrivingLicenseHelp")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document Upload Slot (UI placeholder)
// ---------------------------------------------------------------------------

function DocumentUploadSlot({
  label,
  uploaded,
}: {
  label: string;
  uploaded: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border-2 border-dashed p-4 ${
        uploaded
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
          : "border-border bg-muted/30"
      }`}
    >
      {uploaded ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      ) : (
        <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Legal Agreements
// ---------------------------------------------------------------------------

function Step4Legal({
  data,
  errors,
  updateField,
  t,
}: {
  data: WizardData;
  errors: StepErrors;
  updateField: <K extends keyof WizardData>(
    field: K,
    value: WizardData[K],
  ) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const agreements: { key: keyof WizardData; label: string }[] = [
    { key: "termsOfService", label: t("driverRegistration.termsOfService") },
    { key: "privacyPolicy", label: t("driverRegistration.privacyPolicy") },
    { key: "cashHandling", label: t("driverRegistration.cashHandling") },
    {
      key: "backgroundCheck",
      label: t("driverRegistration.backgroundCheck"),
    },
    {
      key: "ageConfirmation",
      label: t("driverRegistration.ageConfirmation"),
    },
    {
      key: "independentContractor",
      label: t("driverRegistration.independentContractor"),
    },
  ];

  return (
    <div className="space-y-4">
      {errors.agreements && (
        <div
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors.agreements}
        </div>
      )}

      {errors.ageConfirmation && (
        <div
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors.ageConfirmation}
        </div>
      )}

      {agreements.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
        >
          <input
            type="checkbox"
            checked={data[key] as boolean}
            onChange={(e) =>
              updateField(key, e.target.checked as never)
            }
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-ember"
          />
          <span className="text-sm leading-relaxed">{label}</span>
        </label>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Availability
// ---------------------------------------------------------------------------

function Step5Availability({
  data,
  errors,
  updateField,
  t,
}: {
  data: WizardData;
  errors: StepErrors;
  updateField: <K extends keyof WizardData>(
    field: K,
    value: WizardData[K],
  ) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const addSlot = (dayOfWeek: string) => {
    const newSlots = [
      ...data.availabilitySlots,
      { dayOfWeek, startTime: "08:00", endTime: "18:00" },
    ];

    updateField("availabilitySlots", newSlots);
  };

  const removeSlot = (index: number) => {
    const newSlots = data.availabilitySlots.filter((_, i) => i !== index);

    updateField("availabilitySlots", newSlots);
  };

  const updateSlot = (
    index: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    const newSlots = data.availabilitySlots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot,
    );

    updateField("availabilitySlots", newSlots);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-1 text-sm font-medium">
          {t("driverRegistration.availabilityTitle")}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t("driverRegistration.availabilityDesc")}
        </p>
      </div>

      {/* Max distance */}
      <FieldWrapper
        label={t("driverRegistration.maxDistance")}
        htmlFor="reg-maxdistance"
        error={errors.maxDistance}
      >
        <Select
          value={data.maxDistance}
          onValueChange={(val) => updateField("maxDistance", val)}
        >
          <SelectTrigger id="reg-maxdistance" className="h-12">
            <SelectValue
              placeholder={t("driverRegistration.maxDistancePlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            {DISTANCE_OPTIONS.map((km) => (
              <SelectItem key={km} value={km}>
                {t("driverRegistration.maxDistanceKm", { km })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>

      {/* Day-by-day availability */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const daySlots = data.availabilitySlots
            .map((slot, i) => ({ ...slot, index: i }))
            .filter((slot) => slot.dayOfWeek === day);

          return (
            <div
              key={day}
              className="rounded-lg border border-border p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t(`driverRegistration.${day}`)}
                </span>
                <button
                  type="button"
                  onClick={() => addSlot(day)}
                  className="text-xs font-medium text-ember hover:underline"
                >
                  + {t("driverRegistration.addTimeSlot")}
                </button>
              </div>

              {daySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground">--</p>
              ) : (
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.index}
                      className="flex items-center gap-2"
                    >
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(slot.index, "startTime", e.target.value)
                        }
                        className="h-9 w-28 text-sm"
                        aria-label={t("driverRegistration.startTime")}
                      />
                      <span className="text-xs text-muted-foreground">
                        -
                      </span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSlot(slot.index, "endTime", e.target.value)
                        }
                        className="h-9 w-28 text-sm"
                        aria-label={t("driverRegistration.endTime")}
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.index)}
                        className="text-xs text-destructive hover:underline"
                      >
                        {t("driverRegistration.removeTimeSlot")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 6: Review & Submit
// ---------------------------------------------------------------------------

function Step6Review({
  data,
  goToStep,
  t,
}: {
  data: WizardData;
  goToStep: (step: number) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const vehicleLabel =
    VEHICLE_OPTIONS.find((v) => v.value === data.vehicleType)?.labelKey ?? "";

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h4 className="text-lg font-semibold">
          {t("driverRegistration.reviewTitle")}
        </h4>
        <p className="text-sm text-muted-foreground">
          {t("driverRegistration.reviewDesc")}
        </p>
      </div>

      {/* Personal Information */}
      <ReviewSection
        title={t("driverRegistration.sectionPersonal")}
        onEdit={() => goToStep(1)}
        editLabel={t("driverRegistration.editSection")}
      >
        <ReviewRow label={t("driverRegistration.fullName")} value={data.fullName} />
        <ReviewRow label={t("driverRegistration.phone")} value={data.phone} />
        <ReviewRow label={t("driverRegistration.email")} value={data.email || "--"} />
        <ReviewRow
          label={t("driverRegistration.dateOfBirth")}
          value={data.dateOfBirth || "--"}
        />
        <ReviewRow label={t("driverRegistration.city")} value={data.city} />
        <ReviewRow
          label={t("driverRegistration.emergencyContactName")}
          value={data.emergencyContactName}
        />
        <ReviewRow
          label={t("driverRegistration.emergencyContactPhone")}
          value={data.emergencyContactPhone}
        />
      </ReviewSection>

      {/* Vehicle Information */}
      <ReviewSection
        title={t("driverRegistration.sectionVehicle")}
        onEdit={() => goToStep(2)}
        editLabel={t("driverRegistration.editSection")}
      >
        <ReviewRow
          label={t("driverRegistration.vehicleType")}
          value={vehicleLabel ? t(vehicleLabel) : "--"}
        />
        {isMotorized(data.vehicleType) && (
          <>
            <ReviewRow
              label={t("driverRegistration.plateNumber")}
              value={data.plateNumber || "--"}
            />
            <ReviewRow
              label={t("driverRegistration.vehicleMake")}
              value={data.vehicleMake || "--"}
            />
            <ReviewRow
              label={t("driverRegistration.insuranceExpiry")}
              value={data.insuranceExpiry || "--"}
            />
          </>
        )}
      </ReviewSection>

      {/* Documents */}
      <ReviewSection
        title={t("driverRegistration.sectionDocuments")}
        onEdit={() => goToStep(3)}
        editLabel={t("driverRegistration.editSection")}
      >
        <ReviewRow
          label={t("driverRegistration.nationalIdType")}
          value={
            data.nationalIdType === "cnie"
              ? t("driverRegistration.nationalIdTypeCNIE")
              : data.nationalIdType === "passport"
                ? t("driverRegistration.nationalIdTypePassport")
                : "--"
          }
        />
        <ReviewRow label={t("driverRegistration.idNumber")} value={data.idNumber || "--"} />
        <ReviewRow
          label={t("driverRegistration.idExpiry")}
          value={data.idExpiry || "--"}
        />
        <ReviewRow
          label={t("driverRegistration.adminDocuments")}
          value={t("driverRegistration.documentsUploaded", {
            count: data.documents.length,
          })}
        />
      </ReviewSection>

      {/* Legal */}
      <ReviewSection
        title={t("driverRegistration.sectionLegal")}
        onEdit={() => goToStep(4)}
        editLabel={t("driverRegistration.editSection")}
      >
        <div className="flex items-center gap-2">
          {data.termsOfService &&
          data.privacyPolicy &&
          data.cashHandling &&
          data.backgroundCheck &&
          data.ageConfirmation &&
          data.independentContractor ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-emerald-600">
                {t("driverRegistration.allAgreementsAccepted")}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                {t("driverRegistration.allAgreementsRequired")}
              </span>
            </>
          )}
        </div>
      </ReviewSection>

      {/* Availability */}
      <ReviewSection
        title={t("driverRegistration.sectionAvailability")}
        onEdit={() => goToStep(5)}
        editLabel={t("driverRegistration.editSection")}
      >
        <ReviewRow
          label={t("driverRegistration.maxDistance")}
          value={t("driverRegistration.maxDistanceKm", {
            km: data.maxDistance,
          })}
        />
        <ReviewRow
          label={t("driverRegistration.availabilityTitle")}
          value={t("driverRegistration.timeSlotsSet", {
            count: data.availabilitySlots.length,
          })}
        />
      </ReviewSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review helpers
// ---------------------------------------------------------------------------

function ReviewSection({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="text-sm font-semibold">{title}</h5>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-medium text-ember hover:underline"
        >
          <Pencil className="h-3 w-3" />
          {editLabel}
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

function FieldWrapper({
  label,
  htmlFor,
  error,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {help && !error && (
        <p className="text-xs text-muted-foreground">{help}</p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
