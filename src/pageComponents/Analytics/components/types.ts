// ---------------------------------------------------------------------------
// Shared types for Analytics sub-components
// ---------------------------------------------------------------------------

export type Period = "today" | "7d" | "30d" | "90d" | "all";

export interface ViewByDay {
  date: string;
  count: number;
}

export interface TopDish {
  dishName: string;
  clicks: number;
  orders: number;
}

export interface TopReferrer {
  referrer: string;
  count: number;
}

export interface DeviceBreakdown {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}
