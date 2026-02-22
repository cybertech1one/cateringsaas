import { logger } from "~/server/logger";
import type {
  CRMConfig,
  CRMPerson,
  CRMOpportunity,
  CRMCompany,
  CRMSyncResult,
} from "./types";

export class TwentyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: CRMConfig) {
    this.apiKey = config.apiKey;
    // Ensure baseUrl ends without trailing slash, normalize to /api
    this.baseUrl = config.workspaceUrl.replace(/\/+$/, "");
    if (!this.baseUrl.includes("/api")) {
      this.baseUrl += "/api";
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");

      logger.error(
        `Twenty API error: ${response.status} ${errorText}`,
        undefined,
        "crm",
      );
      throw new Error(`Twenty API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request("/objects/people?limit=1");

      return true;
    } catch {
      return false;
    }
  }

  async createPerson(person: CRMPerson): Promise<string> {
    const result = await this.request<{ data: { id: string } }>(
      "/objects/people",
      {
        method: "POST",
        body: JSON.stringify(person),
      },
    );

    return result.data.id;
  }

  async createOpportunity(opportunity: CRMOpportunity): Promise<string> {
    const result = await this.request<{ data: { id: string } }>(
      "/objects/opportunities",
      {
        method: "POST",
        body: JSON.stringify(opportunity),
      },
    );

    return result.data.id;
  }

  async createCompany(company: CRMCompany): Promise<string> {
    const result = await this.request<{ data: { id: string } }>(
      "/objects/companies",
      {
        method: "POST",
        body: JSON.stringify(company),
      },
    );

    return result.data.id;
  }

  async syncPeople(people: CRMPerson[]): Promise<CRMSyncResult> {
    let synced = 0;
    const errors: string[] = [];

    for (const person of people) {
      try {
        await this.createPerson(person);
        synced++;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unknown error";

        errors.push(`Failed to sync ${person.phone}: ${msg}`);
      }
    }

    return { synced, failed: errors.length, errors };
  }

  async syncOpportunities(
    opportunities: CRMOpportunity[],
  ): Promise<CRMSyncResult> {
    let synced = 0;
    const errors: string[] = [];

    for (const opp of opportunities) {
      try {
        await this.createOpportunity(opp);
        synced++;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unknown error";

        errors.push(`Failed to sync ${opp.name}: ${msg}`);
      }
    }

    return { synced, failed: errors.length, errors };
  }
}
