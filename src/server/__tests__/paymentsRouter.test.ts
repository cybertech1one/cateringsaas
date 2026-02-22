import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { resetRateLimits } from "~/server/rateLimit";

/**
 * Tests for the payments tRPC router.
 * Covers createPremiumCheckout, cancelSubscription, getSubscriptionInfo,
 * and getCustomerPortalUrl procedures.
 *
 * Uses mocked Prisma client and LemonSqueezy client to avoid external dependencies.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockCreateCheckout, mockUpdateSubscription, mockRetrieveSubscription } = vi.hoisted(() => ({
  mockCreateCheckout: vi.fn(),
  mockUpdateSubscription: vi.fn(),
  mockRetrieveSubscription: vi.fn(),
}));

vi.mock("lemonsqueezy.ts", () => {
  return {
    LemonsqueezyClient: class MockLemonsqueezyClient {
      createCheckout = mockCreateCheckout;
      updateSubscription = mockUpdateSubscription;
      retrieveSubscription = mockRetrieveSubscription;
    },
  };
});

vi.mock("~/env.mjs", () => ({
  env: {
    LEMON_SQUEEZY_API_KEY: "test-api-key",
    LEMON_SQUEEZY_STORE_ID: "test-store-id",
    LEMON_SQUEEZY_SUBSCRIPTION_VARIANT_ID: "test-variant-id",
  },
}));

vi.mock("~/server/db", () => ({
  db: {
    subscriptions: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
}));

vi.mock("~/server/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Override checkIfSubscribed to not rely on NODE_ENV
vi.mock("~/shared/hooks/useUserSubscription", () => ({
  checkIfSubscribed: (status?: string) => {
    return (
      status === "active" ||
      status === "cancelled" ||
      status === "on_trial" ||
      status === "past_due"
    );
  },
}));

import { db } from "~/server/db";
import { paymentsRouter } from "../api/routers/payments";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_USER_ID = "00000000-0000-4000-a000-000000000099";
const TEST_USER_EMAIL = "test@example.com";

// ---------------------------------------------------------------------------
// Helper: create a tRPC caller with a mock context
// ---------------------------------------------------------------------------

function createMockCaller(userId: string, email = TEST_USER_EMAIL) {
  return paymentsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: userId, email } as never,
  });
}

function createUnauthCaller() {
  return paymentsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("paymentsRouter", () => {
  const mockSubscriptions = vi.mocked(db.subscriptions);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    resetRateLimits();
  });

  // =========================================================================
  // createPremiumCheckout
  // =========================================================================

  describe("createPremiumCheckout", () => {
    it("should create a checkout session and return the URL", async () => {
      const caller = createMockCaller(TEST_USER_ID);
      const checkoutUrl = "https://checkout.lemonsqueezy.com/test-session";

      mockCreateCheckout.mockResolvedValue({
        data: { attributes: { url: checkoutUrl } },
      } as never);

      const result = await caller.createPremiumCheckout({ language: "en" });

      expect(result).toBe(checkoutUrl);
    });

    it("should pass English translations for en language", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockCreateCheckout.mockResolvedValue({
        data: { attributes: { url: "https://checkout.example.com" } },
      } as never);

      await caller.createPremiumCheckout({ language: "en" });

      expect(mockCreateCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          product_options: expect.objectContaining({
            name: "FeastQR Menu",
            description: "Display QR menus to your clients.",
          }),
        }),
      );
    });

    it("should pass French translations for fr language", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockCreateCheckout.mockResolvedValue({
        data: { attributes: { url: "https://checkout.example.com" } },
      } as never);

      await caller.createPremiumCheckout({ language: "fr" });

      expect(mockCreateCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          product_options: expect.objectContaining({
            description: "Affichez vos menus QR pour vos clients.",
          }),
        }),
      );
    });

    it("should pass Arabic translations for ar language", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockCreateCheckout.mockResolvedValue({
        data: { attributes: { url: "https://checkout.example.com" } },
      } as never);

      await caller.createPremiumCheckout({ language: "ar" });

      expect(mockCreateCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          product_options: expect.objectContaining({
            description: "اعرض قوائم QR لعملائك.",
          }),
        }),
      );
    });

    it("should include user id and email in checkout data", async () => {
      const caller = createMockCaller(TEST_USER_ID, "premium@example.com");

      mockCreateCheckout.mockResolvedValue({
        data: { attributes: { url: "https://checkout.example.com" } },
      } as never);

      await caller.createPremiumCheckout({ language: "en" });

      expect(mockCreateCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          checkout_data: expect.objectContaining({
            custom: { userId: TEST_USER_ID },
            name: "premium@example.com",
            email: "premium@example.com",
          }),
        }),
      );
    });

    it("should throw INTERNAL_SERVER_ERROR when LemonSqueezy fails", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockCreateCheckout.mockRejectedValue(new Error("API unreachable") as never);

      await expect(
        caller.createPremiumCheckout({ language: "en" }),
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.createPremiumCheckout({ language: "en" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create checkout session. Please try again later.",
      });
    });

    it("should reject invalid language input", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      await expect(
        caller.createPremiumCheckout({ language: "de" as never }),
      ).rejects.toThrow();
    });

    it("should reject unauthenticated requests", async () => {
      const caller = createUnauthCaller();

      await expect(
        (caller as ReturnType<typeof createMockCaller>).createPremiumCheckout({ language: "en" }),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should re-throw TRPCError from checkout without wrapping", async () => {
      const caller = createMockCaller(TEST_USER_ID);
      const trpcError = new TRPCError({ code: "BAD_REQUEST", message: "Custom error" });

      mockCreateCheckout.mockRejectedValue(trpcError as never);

      await expect(
        caller.createPremiumCheckout({ language: "en" }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Custom error",
      });
    });
  });

  // =========================================================================
  // cancelSubscription
  // =========================================================================

  describe("cancelSubscription", () => {
    it("should cancel an active subscription", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-123",
        status: "active",
      } as never);

      mockUpdateSubscription.mockResolvedValue({
        data: { attributes: { cancelled: true } },
      } as never);

      // Should not throw
      await expect(caller.cancelSubscription()).resolves.toBeUndefined();
    });

    it("should throw CONFLICT when no subscription exists", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue(null as never);

      await expect(caller.cancelSubscription()).rejects.toThrow(TRPCError);
      await expect(caller.cancelSubscription()).rejects.toMatchObject({
        code: "CONFLICT",
        message: "Subscription not found or not active",
      });
    });

    it("should throw CONFLICT when subscription is not active", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-123",
        status: "cancelled",
      } as never);

      await expect(caller.cancelSubscription()).rejects.toMatchObject({
        code: "CONFLICT",
        message: "Subscription not found or not active",
      });
    });

    it("should throw INTERNAL_SERVER_ERROR when cancellation flag is false", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-123",
        status: "active",
      } as never);

      mockUpdateSubscription.mockResolvedValue({
        data: { attributes: { cancelled: false } },
      } as never);

      await expect(caller.cancelSubscription()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    });

    it("should throw INTERNAL_SERVER_ERROR when LemonSqueezy update fails", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-123",
        status: "active",
      } as never);

      mockUpdateSubscription.mockRejectedValue(new Error("Network error") as never);

      await expect(caller.cancelSubscription()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription. Please try again later.",
      });
    });

    it("should pass the correct subscription id to LemonSqueezy", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-456",
        status: "active",
      } as never);

      mockUpdateSubscription.mockResolvedValue({
        data: { attributes: { cancelled: true } },
      } as never);

      await caller.cancelSubscription();

      expect(mockUpdateSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "ls-sub-456",
          cancelled: true,
        }),
      );
    });

    it("should reject unauthenticated requests", async () => {
      const caller = createUnauthCaller();

      await expect(
        (caller as ReturnType<typeof createMockCaller>).cancelSubscription(),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should query subscription by authenticated user's profile id", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue(null as never);

      try {
        await caller.cancelSubscription();
      } catch {
        // Expected
      }

      expect(mockSubscriptions.findFirst).toHaveBeenCalledWith({
        where: { profileId: TEST_USER_ID },
      });
    });
  });

  // =========================================================================
  // getSubscriptionInfo
  // =========================================================================

  describe("getSubscriptionInfo", () => {
    it("should return subscription info with selected fields", async () => {
      const caller = createMockCaller(TEST_USER_ID);
      const subData = {
        endsAt: new Date("2025-12-31"),
        renewsAt: new Date("2025-06-01"),
        status: "active",
        updatePaymentUrl: "https://checkout.lemonsqueezy.com/update",
      };

      mockSubscriptions.findFirst.mockResolvedValue(subData as never);

      const result = await caller.getSubscriptionInfo();

      expect(result).toEqual(subData);
    });

    it("should return null when no subscription exists", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue(null as never);

      const result = await caller.getSubscriptionInfo();

      expect(result).toBeNull();
    });

    it("should query with correct select fields", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue(null as never);

      await caller.getSubscriptionInfo();

      expect(mockSubscriptions.findFirst).toHaveBeenCalledWith({
        where: { profileId: TEST_USER_ID },
        select: {
          endsAt: true,
          renewsAt: true,
          status: true,
          updatePaymentUrl: true,
        },
      });
    });

    it("should reject unauthenticated requests", async () => {
      const caller = createUnauthCaller();

      await expect(
        (caller as ReturnType<typeof createMockCaller>).getSubscriptionInfo(),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should propagate database errors", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockRejectedValue(new Error("Connection lost") as never);

      await expect(caller.getSubscriptionInfo()).rejects.toThrow("Connection lost");
    });
  });

  // =========================================================================
  // getCustomerPortalUrl
  // =========================================================================

  describe("getCustomerPortalUrl", () => {
    it("should return portal URL for active subscription", async () => {
      const caller = createMockCaller(TEST_USER_ID);
      const portalUrl = "https://portal.lemonsqueezy.com/customer/abc123";

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-789",
        status: "active",
      } as never);

      mockRetrieveSubscription.mockResolvedValue({
        data: {
          attributes: {
            urls: { customer_portal: portalUrl },
          },
        },
      } as never);

      const result = await caller.getCustomerPortalUrl();

      expect(result).toBe(portalUrl);
    });

    it("should throw CONFLICT when no subscription exists", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue(null as never);

      await expect(caller.getCustomerPortalUrl()).rejects.toThrow(TRPCError);
      await expect(caller.getCustomerPortalUrl()).rejects.toMatchObject({
        code: "CONFLICT",
        message: "Subscription not found or not active",
      });
    });

    it("should throw CONFLICT when subscription is expired", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-789",
        status: "expired",
      } as never);

      await expect(caller.getCustomerPortalUrl()).rejects.toMatchObject({
        code: "CONFLICT",
        message: "Subscription not found or not active",
      });
    });

    it("should work for cancelled subscriptions (still subscribed)", async () => {
      const caller = createMockCaller(TEST_USER_ID);
      const portalUrl = "https://portal.lemonsqueezy.com/customer/cancelled";

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-100",
        status: "cancelled",
      } as never);

      mockRetrieveSubscription.mockResolvedValue({
        data: {
          attributes: {
            urls: { customer_portal: portalUrl },
          },
        },
      } as never);

      const result = await caller.getCustomerPortalUrl();

      expect(result).toBe(portalUrl);
    });

    it("should throw INTERNAL_SERVER_ERROR when portal URL is empty", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-789",
        status: "active",
      } as never);

      mockRetrieveSubscription.mockResolvedValue({
        data: {
          attributes: {
            urls: { customer_portal: "" },
          },
        },
      } as never);

      await expect(caller.getCustomerPortalUrl()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Customer portal URL not available",
      });
    });

    it("should throw INTERNAL_SERVER_ERROR when LemonSqueezy retrieval fails", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-789",
        status: "active",
      } as never);

      mockRetrieveSubscription.mockRejectedValue(new Error("Service unavailable") as never);

      await expect(caller.getCustomerPortalUrl()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve customer portal URL. Please try again later.",
      });
    });

    it("should pass the correct subscription id to LemonSqueezy", async () => {
      const caller = createMockCaller(TEST_USER_ID);

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-special",
        status: "active",
      } as never);

      mockRetrieveSubscription.mockResolvedValue({
        data: {
          attributes: {
            urls: { customer_portal: "https://portal.example.com" },
          },
        },
      } as never);

      await caller.getCustomerPortalUrl();

      expect(mockRetrieveSubscription).toHaveBeenCalledWith({
        id: "ls-sub-special",
      });
    });

    it("should reject unauthenticated requests", async () => {
      const caller = createUnauthCaller();

      await expect(
        (caller as ReturnType<typeof createMockCaller>).getCustomerPortalUrl(),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should re-throw TRPCError from retrieve without wrapping", async () => {
      const caller = createMockCaller(TEST_USER_ID);
      const trpcError = new TRPCError({ code: "TIMEOUT", message: "Timed out" });

      mockSubscriptions.findFirst.mockResolvedValue({
        id: "sub-1",
        profileId: TEST_USER_ID,
        lemonSqueezyId: "ls-sub-789",
        status: "active",
      } as never);

      mockRetrieveSubscription.mockRejectedValue(trpcError as never);

      await expect(caller.getCustomerPortalUrl()).rejects.toMatchObject({
        code: "TIMEOUT",
        message: "Timed out",
      });
    });
  });
});
