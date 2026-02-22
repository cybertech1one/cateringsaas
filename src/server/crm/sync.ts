import { TwentyClient } from "./twenty";
import {
  mapOrderToCustomer,
  mapOrderToOpportunity,
  mapRestaurantToCompany,
} from "./mapping";
import type { CRMConfig, CRMSyncResult } from "./types";
import { logger } from "~/server/logger";

interface SyncableOrder {
  customerName: string | null;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  orderNumber: number;
}

interface SyncableRestaurant {
  name: string;
  address?: string | null;
}

export async function syncCustomersToTwenty(
  config: CRMConfig,
  orders: SyncableOrder[],
): Promise<CRMSyncResult> {
  const client = new TwentyClient(config);

  // Deduplicate by phone
  const uniqueCustomers = new Map<string, SyncableOrder>();

  for (const order of orders) {
    if (!uniqueCustomers.has(order.customerPhone)) {
      uniqueCustomers.set(order.customerPhone, order);
    }
  }

  const people = Array.from(uniqueCustomers.values()).map(mapOrderToCustomer);

  logger.info(`Syncing ${people.length} customers to Twenty CRM`, "crm");

  return client.syncPeople(people);
}

export async function syncOrdersToTwenty(
  config: CRMConfig,
  orders: SyncableOrder[],
): Promise<CRMSyncResult> {
  const client = new TwentyClient(config);
  const opportunities = orders.map(mapOrderToOpportunity);

  logger.info(
    `Syncing ${opportunities.length} orders to Twenty CRM`,
    "crm",
  );

  return client.syncOpportunities(opportunities);
}

export async function syncRestaurantToTwenty(
  config: CRMConfig,
  restaurant: SyncableRestaurant,
): Promise<CRMSyncResult> {
  const client = new TwentyClient(config);

  try {
    const company = mapRestaurantToCompany(restaurant);

    await client.createCompany(company);

    return { synced: 1, failed: 0, errors: [] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    return { synced: 0, failed: 1, errors: [msg] };
  }
}
