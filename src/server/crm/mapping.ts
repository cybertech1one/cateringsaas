import type { CRMPerson, CRMOpportunity, CRMCompany } from "./types";

interface OrderData {
  customerName: string | null;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  orderNumber: number;
}

interface RestaurantData {
  name: string;
  address?: string | null;
}

export function mapOrderToCustomer(order: OrderData): CRMPerson {
  const nameParts = (order.customerName ?? "Customer").split(" ");

  return {
    name: {
      firstName: nameParts[0] ?? "Customer",
      lastName: nameParts.slice(1).join(" ") || "",
    },
    phone: order.customerPhone,
  };
}

export function mapOrderToOpportunity(order: OrderData): CRMOpportunity {
  const stageMap: Record<string, string> = {
    pending: "NEW",
    confirmed: "IN_PROGRESS",
    preparing: "IN_PROGRESS",
    ready: "WON",
    completed: "WON",
    cancelled: "LOST",
  };

  return {
    name: `Order #${order.orderNumber}`,
    amount: order.totalAmount / 100, // cents to dollars
    stage: stageMap[order.status] ?? "NEW",
    closeDate: order.createdAt.toISOString().split("T")[0]!,
  };
}

export function mapRestaurantToCompany(
  restaurant: RestaurantData,
): CRMCompany {
  return {
    name: restaurant.name,
    address: restaurant.address ?? undefined,
  };
}
