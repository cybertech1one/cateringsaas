import { NextResponse } from "next/server";
import { getHealthStatus, recordMetric, METRIC } from "~/server/monitoring";
import { logger } from "~/server/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    const health = await getHealthStatus();

    const totalLatency = Date.now() - start;

    recordMetric(METRIC.API_RESPONSE_TIME, totalLatency, {
      route: "/api/health",
      method: "GET",
    });

    const httpStatus = health.status === "unhealthy" ? 503 : 200;

    return NextResponse.json(health, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("Health endpoint failed", error, "health");

    recordMetric(METRIC.API_ERROR, 1, {
      route: "/api/health",
      method: "GET",
    });

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        message: "Health check failed unexpectedly",
      },
      { status: 503 },
    );
  }
}
