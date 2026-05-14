import api from './client';

export interface ActivityEntry {
  _id: string;
  action: 'create' | 'update' | 'restore' | 'delete' | 'status_change';
  entityType: 'note' | 'source' | 'component';
  entityId: string;
  entityTitle: string;
  actor: 'natty' | 'mcp' | 'system' | 'admin';
  summary: string;
  diff?: {
    linesAdded: number;
    linesRemoved: number;
    containersAdded: string[];
    containersRemoved: string[];
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface ActivityFilters {
  entityType?: string;
  actor?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

interface ActivityResponse {
  items: ActivityEntry[];
  total: number;
}

export async function getActivity(filters?: ActivityFilters) {
  const { data } = await api.get<ActivityResponse>('/activity', { params: filters });
  return data;
}
