export interface CRMConfig {
  apiKey: string;
  workspaceUrl: string;
}

export interface CRMPerson {
  name: { firstName: string; lastName: string };
  phone: string;
  email?: string;
  city?: string;
}

export interface CRMOpportunity {
  name: string;
  amount: number;
  stage: string;
  closeDate: string;
}

export interface CRMCompany {
  name: string;
  address?: string;
  employees?: number;
}

export interface CRMSyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export interface CRMSyncStatus {
  lastSyncedAt: string | null;
  totalSynced: number;
  syncErrors: string[];
  isConfigured: boolean;
}
