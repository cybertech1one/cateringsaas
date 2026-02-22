import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the Twenty CRM integration modules:
 * - TwentyClient: HTTP client for Twenty CRM REST API
 * - Mapping: transforms Diyafa domain objects to CRM entities
 * - Sync: orchestrates deduplication + batch sync via TwentyClient
 */

vi.mock("~/server/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

import { TwentyClient } from "../twenty";
import {
  mapOrderToCustomer,
  mapOrderToOpportunity,
  mapRestaurantToCompany,
} from "../mapping";
import {
  syncCustomersToTwenty,
  syncOrdersToTwenty,
  syncRestaurantToTwenty,
} from "../sync";
import type { CRMConfig } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides?: Partial<CRMConfig>): CRMConfig {
  return {
    apiKey: "test-api-key-abc123",
    workspaceUrl: "https://crm.example.com",
    ...overrides,
  };
}

function makeOrder(overrides?: Record<string, unknown>) {
  return {
    customerName: "John Doe",
    customerPhone: "+212600000001",
    totalAmount: 4500,
    status: "completed",
    createdAt: new Date("2026-01-15T10:30:00Z"),
    orderNumber: 42,
    ...overrides,
  };
}

function mockFetchOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  } as never);
}

function mockFetchError(status: number, body = "Server Error") {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: () => Promise.resolve(body),
  } as never);
}

// ===========================================================================
// TwentyClient
// ===========================================================================

describe("TwentyClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Constructor URL normalization ----

  describe("constructor URL normalization", () => {
    it("appends /api when not present", () => {
      const client = new TwentyClient(
        makeConfig({ workspaceUrl: "https://crm.example.com" }),
      );

      mockFetchOk({ data: [] });

      void client.testConnection();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://crm.example.com/api/objects/people?limit=1",
        expect.anything(),
      );
    });

    it("strips trailing slashes before appending /api", () => {
      const client = new TwentyClient(
        makeConfig({ workspaceUrl: "https://crm.example.com///" }),
      );

      mockFetchOk({ data: [] });

      void client.testConnection();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://crm.example.com/api/objects/people?limit=1",
        expect.anything(),
      );
    });

    it("does not double-add /api if already present", () => {
      const client = new TwentyClient(
        makeConfig({ workspaceUrl: "https://crm.example.com/api" }),
      );

      mockFetchOk({ data: [] });

      void client.testConnection();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://crm.example.com/api/objects/people?limit=1",
        expect.anything(),
      );
    });
  });

  // ---- Request headers ----

  describe("request headers", () => {
    it("sends Bearer token and Content-Type on every request", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchOk({ data: [] });

      await client.testConnection();

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];

      expect(options.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer test-api-key-abc123",
          "Content-Type": "application/json",
        }),
      );
    });
  });

  // ---- testConnection ----

  describe("testConnection", () => {
    it("returns true when API responds with 200", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchOk({ data: [] });

      const result = await client.testConnection();

      expect(result).toBe(true);
    });

    it("returns false when API returns an error", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchError(401, "Unauthorized");

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  // ---- createPerson ----

  describe("createPerson", () => {
    it("sends POST to /objects/people and returns the created ID", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchOk({ data: { id: "person-id-1" } });

      const person = {
        name: { firstName: "Alice", lastName: "Martin" },
        phone: "+212600000001",
      };
      const id = await client.createPerson(person);

      expect(id).toBe("person-id-1");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://crm.example.com/api/objects/people",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(person),
        }),
      );
    });
  });

  // ---- createOpportunity ----

  describe("createOpportunity", () => {
    it("sends POST to /objects/opportunities and returns the created ID", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchOk({ data: { id: "opp-id-1" } });

      const opp = {
        name: "Order #1",
        amount: 45,
        stage: "WON",
        closeDate: "2026-01-15",
      };
      const id = await client.createOpportunity(opp);

      expect(id).toBe("opp-id-1");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://crm.example.com/api/objects/opportunities",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(opp),
        }),
      );
    });
  });

  // ---- createCompany ----

  describe("createCompany", () => {
    it("sends POST to /objects/companies and returns the created ID", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchOk({ data: { id: "company-id-1" } });

      const company = { name: "Riad Marrakech" };
      const id = await client.createCompany(company);

      expect(id).toBe("company-id-1");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://crm.example.com/api/objects/companies",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(company),
        }),
      );
    });
  });

  // ---- syncPeople ----

  describe("syncPeople", () => {
    it("counts successes and returns zero failures for all-ok batch", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchOk({ data: { id: "p1" } });
      mockFetchOk({ data: { id: "p2" } });

      const people = [
        { name: { firstName: "A", lastName: "B" }, phone: "+1" },
        { name: { firstName: "C", lastName: "D" }, phone: "+2" },
      ];
      const result = await client.syncPeople(people);

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("records errors without stopping the rest of the batch", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchError(500, "Internal Server Error");
      mockFetchOk({ data: { id: "p2" } });

      const people = [
        { name: { firstName: "A", lastName: "B" }, phone: "+fail" },
        { name: { firstName: "C", lastName: "D" }, phone: "+ok" },
      ];
      const result = await client.syncPeople(people);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("+fail");
    });
  });

  // ---- syncOpportunities ----

  describe("syncOpportunities", () => {
    it("counts successes and returns zero failures for all-ok batch", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchOk({ data: { id: "o1" } });
      mockFetchOk({ data: { id: "o2" } });

      const opps = [
        { name: "Order #1", amount: 10, stage: "NEW", closeDate: "2026-01-01" },
        { name: "Order #2", amount: 20, stage: "WON", closeDate: "2026-01-02" },
      ];
      const result = await client.syncOpportunities(opps);

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("records errors per failed opportunity", async () => {
      const client = new TwentyClient(makeConfig());

      mockFetchOk({ data: { id: "o1" } });
      mockFetchError(422, "Validation error");

      const opps = [
        { name: "Order #1", amount: 10, stage: "NEW", closeDate: "2026-01-01" },
        { name: "Order #2", amount: 20, stage: "WON", closeDate: "2026-01-02" },
      ];
      const result = await client.syncOpportunities(opps);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors[0]).toContain("Order #2");
    });
  });
});

// ===========================================================================
// Mapping functions
// ===========================================================================

describe("mapping", () => {
  describe("mapOrderToCustomer", () => {
    it("splits full name into firstName and lastName", () => {
      const order = makeOrder({ customerName: "Alice Martin" });
      const person = mapOrderToCustomer(order);

      expect(person.name.firstName).toBe("Alice");
      expect(person.name.lastName).toBe("Martin");
      expect(person.phone).toBe("+212600000001");
    });

    it("handles multi-word last names", () => {
      const order = makeOrder({ customerName: "Jean Pierre Dupont" });
      const person = mapOrderToCustomer(order);

      expect(person.name.firstName).toBe("Jean");
      expect(person.name.lastName).toBe("Pierre Dupont");
    });

    it("uses single name as firstName with empty lastName", () => {
      const order = makeOrder({ customerName: "Karim" });
      const person = mapOrderToCustomer(order);

      expect(person.name.firstName).toBe("Karim");
      expect(person.name.lastName).toBe("");
    });

    it("falls back to Customer when customerName is null", () => {
      const order = makeOrder({ customerName: null });
      const person = mapOrderToCustomer(order);

      expect(person.name.firstName).toBe("Customer");
      expect(person.name.lastName).toBe("");
    });
  });

  describe("mapOrderToOpportunity", () => {
    it("maps pending status to NEW stage", () => {
      const opp = mapOrderToOpportunity(makeOrder({ status: "pending" }));

      expect(opp.stage).toBe("NEW");
    });

    it("maps confirmed status to IN_PROGRESS stage", () => {
      const opp = mapOrderToOpportunity(makeOrder({ status: "confirmed" }));

      expect(opp.stage).toBe("IN_PROGRESS");
    });

    it("maps preparing status to IN_PROGRESS stage", () => {
      const opp = mapOrderToOpportunity(makeOrder({ status: "preparing" }));

      expect(opp.stage).toBe("IN_PROGRESS");
    });

    it("maps completed status to WON stage", () => {
      const opp = mapOrderToOpportunity(makeOrder({ status: "completed" }));

      expect(opp.stage).toBe("WON");
    });

    it("maps cancelled status to LOST stage", () => {
      const opp = mapOrderToOpportunity(makeOrder({ status: "cancelled" }));

      expect(opp.stage).toBe("LOST");
    });

    it("defaults unknown status to NEW stage", () => {
      const opp = mapOrderToOpportunity(makeOrder({ status: "some_weird_status" }));

      expect(opp.stage).toBe("NEW");
    });

    it("converts totalAmount from cents to dollars", () => {
      const opp = mapOrderToOpportunity(makeOrder({ totalAmount: 4500 }));

      expect(opp.amount).toBe(45);
    });

    it("builds name from order number", () => {
      const opp = mapOrderToOpportunity(makeOrder({ orderNumber: 99 }));

      expect(opp.name).toBe("Order #99");
    });

    it("formats closeDate as ISO date string (YYYY-MM-DD)", () => {
      const opp = mapOrderToOpportunity(
        makeOrder({ createdAt: new Date("2026-03-22T18:45:00Z") }),
      );

      expect(opp.closeDate).toBe("2026-03-22");
    });
  });

  describe("mapRestaurantToCompany", () => {
    it("maps restaurant name to company name", () => {
      const company = mapRestaurantToCompany({ name: "Le Jardin Secret" });

      expect(company.name).toBe("Le Jardin Secret");
    });

    it("maps restaurant address to company address", () => {
      const company = mapRestaurantToCompany({
        name: "Le Jardin",
        address: "12 Rue de la Medina, Marrakech",
      });

      expect(company.address).toBe("12 Rue de la Medina, Marrakech");
    });

    it("converts null address to undefined", () => {
      const company = mapRestaurantToCompany({
        name: "Le Jardin",
        address: null,
      });

      expect(company.address).toBeUndefined();
    });
  });
});

// ===========================================================================
// Sync orchestrators
// ===========================================================================

describe("sync", () => {
  const config = makeConfig();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("syncCustomersToTwenty", () => {
    it("deduplicates orders with the same phone number", async () => {
      // 3 orders, 2 unique phone numbers
      const orders = [
        makeOrder({ customerPhone: "+212600000001", customerName: "Alice A" }),
        makeOrder({ customerPhone: "+212600000002", customerName: "Bob B" }),
        makeOrder({ customerPhone: "+212600000001", customerName: "Alice Dup" }),
      ];

      // Expect only 2 createPerson calls (one per unique phone)
      mockFetchOk({ data: { id: "p1" } });
      mockFetchOk({ data: { id: "p2" } });

      const result = await syncCustomersToTwenty(config, orders);

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("keeps the first order per phone during deduplication", async () => {
      const orders = [
        makeOrder({ customerPhone: "+212600000001", customerName: "First Person" }),
        makeOrder({ customerPhone: "+212600000001", customerName: "Second Person" }),
      ];

      mockFetchOk({ data: { id: "p1" } });

      await syncCustomersToTwenty(config, orders);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string) as { name: { firstName: string } };

      expect(body.name.firstName).toBe("First");
    });

    it("returns failures from the underlying client", async () => {
      const orders = [makeOrder({ customerPhone: "+fail" })];

      mockFetchError(500);

      const result = await syncCustomersToTwenty(config, orders);

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("syncOrdersToTwenty", () => {
    it("maps every order to an opportunity and syncs them", async () => {
      const orders = [
        makeOrder({ orderNumber: 1, status: "completed" }),
        makeOrder({ orderNumber: 2, status: "pending" }),
        makeOrder({ orderNumber: 3, status: "cancelled" }),
      ];

      mockFetchOk({ data: { id: "o1" } });
      mockFetchOk({ data: { id: "o2" } });
      mockFetchOk({ data: { id: "o3" } });

      const result = await syncOrdersToTwenty(config, orders);

      expect(result.synced).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("reports partial failures without stopping the batch", async () => {
      const orders = [
        makeOrder({ orderNumber: 1 }),
        makeOrder({ orderNumber: 2 }),
      ];

      mockFetchOk({ data: { id: "o1" } });
      mockFetchError(500);

      const result = await syncOrdersToTwenty(config, orders);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe("syncRestaurantToTwenty", () => {
    it("creates a company and returns synced=1 on success", async () => {
      const restaurant = { name: "Riad Marrakech", address: "Medina" };

      mockFetchOk({ data: { id: "c1" } });

      const result = await syncRestaurantToTwenty(config, restaurant);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("catches errors and returns synced=0, failed=1", async () => {
      const restaurant = { name: "Riad Marrakech" };

      mockFetchError(500, "Internal Server Error");

      const result = await syncRestaurantToTwenty(config, restaurant);

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Twenty API error: 500");
    });
  });
});
