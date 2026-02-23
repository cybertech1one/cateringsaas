"use client";

import { useMemo } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import {
  Crown,
  Zap,
  Building2,
  Check,
  X,
  CalendarDays,
  Users,
  UtensilsCrossed,
  CreditCard,
  TrendingUp,
  ArrowRight,
  Mail,
  Phone,
  Star,
  Shield,
  Sparkles,
  Receipt,
  Clock,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import { cn } from "~/utils/cn";
import { DashboardPageHeader } from "~/components/DashboardPageHeader";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type SubscriptionTier = "free" | "pro" | "enterprise";

interface PlanConfig {
  name: string;
  nameAr: string;
  price: string;
  priceNote: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  badgeVariant: "secondary" | "default" | "destructive";
  limits: {
    events: number | "unlimited";
    staff: number | "unlimited";
    menus: number | "unlimited";
    storage: string;
  };
  features: string[];
}

const PLANS: Record<SubscriptionTier, PlanConfig> = {
  free: {
    name: "Free",
    nameAr: "مجاني",
    price: "0 MAD",
    priceNote: "Forever free",
    icon: <Zap className="h-5 w-5" />,
    color: "text-muted-foreground",
    bgGradient: "from-muted/50 to-muted/30",
    badgeVariant: "secondary",
    limits: {
      events: 5,
      staff: 2,
      menus: 3,
      storage: "100 MB",
    },
    features: [
      "Up to 5 events/month",
      "2 staff members",
      "3 catering menus",
      "Basic quote generation",
      "Client messaging",
      "100 MB file storage",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    nameAr: "احترافي",
    price: "299 MAD",
    priceNote: "/month",
    icon: <Crown className="h-5 w-5" />,
    color: "text-primary",
    bgGradient: "from-primary/10 via-gold/5 to-primary/10",
    badgeVariant: "default",
    limits: {
      events: 50,
      staff: 10,
      menus: 20,
      storage: "5 GB",
    },
    features: [
      "Up to 50 events/month",
      "10 staff members",
      "20 catering menus",
      "Advanced quote templates",
      "Payment schedule management",
      "Equipment tracking",
      "Analytics dashboard",
      "Portfolio showcase",
      "Calendar integration",
      "5 GB file storage",
      "Priority support",
      "Custom branding",
    ],
  },
  enterprise: {
    name: "Enterprise",
    nameAr: "مؤسسة",
    price: "Custom",
    priceNote: "Contact us",
    icon: <Building2 className="h-5 w-5" />,
    color: "text-gold",
    bgGradient: "from-gold/10 via-gold/5 to-gold/10",
    badgeVariant: "default",
    limits: {
      events: "unlimited",
      staff: "unlimited",
      menus: "unlimited",
      storage: "Unlimited",
    },
    features: [
      "Unlimited events",
      "Unlimited staff members",
      "Unlimited menus",
      "White-label branding",
      "API access",
      "Multi-location support",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced analytics & reporting",
      "SLA guarantee",
      "Unlimited storage",
      "24/7 phone support",
    ],
  },
};

const MOCK_BILLING_HISTORY = [
  {
    id: "inv-001",
    date: "2026-02-01",
    description: "Pro Plan - February 2026",
    amount: 29900,
    status: "paid" as const,
  },
  {
    id: "inv-002",
    date: "2026-01-01",
    description: "Pro Plan - January 2026",
    amount: 29900,
    status: "paid" as const,
  },
  {
    id: "inv-003",
    date: "2025-12-01",
    description: "Pro Plan - December 2025",
    amount: 29900,
    status: "paid" as const,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMAD(centimes: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
  }).format(centimes / 100);
}

function UsageMeter({
  label,
  used,
  limit,
  icon,
}: {
  label: string;
  used: number;
  limit: number | "unlimited";
  icon: React.ReactNode;
}) {
  const isUnlimited = limit === "unlimited";
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span
          className={cn(
            "text-xs",
            isAtLimit
              ? "text-destructive font-medium"
              : isNearLimit
              ? "text-gold font-medium"
              : "text-muted-foreground"
          )}
        >
          {used}/{isUnlimited ? "Unlimited" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn(
            "h-2",
            isAtLimit && "[&>div]:bg-destructive",
            isNearLimit && !isAtLimit && "[&>div]:bg-gold"
          )}
        />
      )}
      {isUnlimited && (
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-sage/40 to-sage/60 rounded-full" />
        </div>
      )}
    </div>
  );
}

function FeatureRow({
  feature,
  included,
}: {
  feature: string;
  included: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {included ? (
        <Check className="h-4 w-4 text-sage shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      )}
      <span className={cn(!included && "text-muted-foreground/50")}>
        {feature}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BillingPage() {
  // ── Queries ────────────────────────────────────────────────────────────
  const orgQuery = api.organizations.getMine.useQuery();
  const org = orgQuery.data;

  // ── Derived data ───────────────────────────────────────────────────────
  const currentTier: SubscriptionTier = (org?.subscriptionTier as SubscriptionTier) ?? "free";
  const currentPlan = PLANS[currentTier];

  // Mock usage data (would come from real endpoints in production)
  const usage = useMemo(
    () => ({
      events: 3,
      staff: org?._count?.members ?? 1,
      menus: 2,
    }),
    [org]
  );

  // ── Loading state ──────────────────────────────────────────────────────
  if (orgQuery.isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <DashboardPageHeader
          title="Billing"
          description="Subscription and billing management"
          icon={<CreditCard className="h-5 w-5" />}
        />
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg">No Organization Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create an organization to view billing information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <DashboardPageHeader
        title="Billing"
        description="Manage your subscription plan and billing"
        icon={<CreditCard className="h-5 w-5" />}
      />

      {/* Current Plan Banner */}
      <Card
        className={cn(
          "overflow-hidden",
          currentTier === "pro" && "border-primary/30",
          currentTier === "enterprise" && "border-gold/30"
        )}
      >
        <CardContent className="p-0">
          <div
            className={cn(
              "bg-gradient-to-r p-5 sm:p-6",
              currentPlan.bgGradient
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    currentTier === "free" && "bg-muted text-muted-foreground",
                    currentTier === "pro" && "bg-primary/10 text-primary",
                    currentTier === "enterprise" && "bg-gold/10 text-gold"
                  )}
                >
                  {currentPlan.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">
                      {currentPlan.name} Plan
                    </h2>
                    <Badge variant={currentPlan.badgeVariant}>
                      Current
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentPlan.price}{" "}
                    <span className="text-xs">{currentPlan.priceNote}</span>
                  </p>
                </div>
              </div>

              {currentTier === "free" && (
                <Button className="bg-primary hover:bg-primary/90 shadow-md">
                  <Crown className="h-4 w-4 mr-1.5" />
                  Upgrade to Pro
                </Button>
              )}
              {currentTier === "pro" && (
                <Button
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  <Building2 className="h-4 w-4 mr-1.5" />
                  Contact for Enterprise
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <UsageMeter
              label="Events this month"
              used={usage.events}
              limit={currentPlan.limits.events}
              icon={
                <CalendarDays className="h-4 w-4 text-primary" />
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <UsageMeter
              label="Staff members"
              used={usage.staff}
              limit={currentPlan.limits.staff}
              icon={<Users className="h-4 w-4 text-sage" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <UsageMeter
              label="Catering menus"
              used={usage.menus}
              limit={currentPlan.limits.menus}
              icon={
                <UtensilsCrossed className="h-4 w-4 text-gold" />
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Plans Comparison */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Compare Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(PLANS) as [SubscriptionTier, PlanConfig][]).map(
            ([tier, plan]) => {
              const isCurrent = tier === currentTier;
              const isRecommended = tier === "pro";

              return (
                <Card
                  key={tier}
                  className={cn(
                    "relative overflow-hidden transition-shadow",
                    isCurrent && "ring-2 ring-primary/30",
                    isRecommended && !isCurrent && "shadow-md"
                  )}
                >
                  {isRecommended && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-primary" />
                  )}
                  <CardContent className="p-5">
                    {/* Plan Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          tier === "free" && "bg-muted text-muted-foreground",
                          tier === "pro" && "bg-primary/10 text-primary",
                          tier === "enterprise" && "bg-gold/10 text-gold"
                        )}
                      >
                        {plan.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold">{plan.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {plan.nameAr}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Current
                        </Badge>
                      )}
                      {isRecommended && !isCurrent && (
                        <Badge className="ml-auto text-xs bg-primary">
                          Recommended
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {plan.priceNote}
                      </span>
                    </div>

                    {/* Limits */}
                    <div className="space-y-2 mb-4 pb-4 border-b">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Events</span>
                        <span className="font-medium">
                          {plan.limits.events === "unlimited"
                            ? "Unlimited"
                            : `${plan.limits.events}/mo`}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Staff</span>
                        <span className="font-medium">
                          {plan.limits.staff === "unlimited"
                            ? "Unlimited"
                            : plan.limits.staff}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Menus</span>
                        <span className="font-medium">
                          {plan.limits.menus === "unlimited"
                            ? "Unlimited"
                            : plan.limits.menus}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Storage</span>
                        <span className="font-medium">
                          {plan.limits.storage}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {plan.features.map((feature) => (
                        <FeatureRow
                          key={feature}
                          feature={feature}
                          included={true}
                        />
                      ))}
                    </div>

                    {/* CTA */}
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : tier === "enterprise" ? (
                      <Button
                        variant="outline"
                        className="w-full border-gold/30 text-gold hover:bg-gold/10"
                      >
                        <Mail className="h-4 w-4 mr-1.5" />
                        Contact Sales
                      </Button>
                    ) : tier === "pro" ? (
                      <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                        <Crown className="h-4 w-4 mr-1.5" />
                        Upgrade to Pro
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full">
                        Downgrade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </div>

      {/* Pro Upgrade CTA (show only for free tier) */}
      {currentTier === "free" && (
        <Card className="overflow-hidden border-primary/20">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/10 via-gold/5 to-primary/10 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">
                      Unlock the full power of Diyafa
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-lg">
                    Upgrade to Pro for advanced quote management, analytics,
                    portfolio showcase, and priority support. Scale your
                    catering business with confidence.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5 text-primary" />
                      Analytics
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-gold" />
                      Portfolio
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-sage" />
                      Priority Support
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Custom Branding
                    </span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shrink-0"
                >
                  <Crown className="h-4 w-4 mr-1.5" />
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Billing History</h3>
            </div>
          </div>

          {currentTier === "free" ? (
            <div className="text-center py-8">
              <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No billing history on the Free plan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      Amount
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BILLING_HISTORY.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3 text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString("fr-MA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3">{invoice.description}</td>
                      <td className="py-3 text-right font-medium">
                        {formatMAD(invoice.amount)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize text-sage"
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card>
        <CardContent className="p-5">
          <div className="text-center py-4">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold">Need help with billing?</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Our team is here to help with any billing questions, plan changes,
              or custom enterprise pricing.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-1.5" />
                billing@diyafa.ma
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-1.5" />
                +212 5XX XXX XXX
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
