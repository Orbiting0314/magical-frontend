import api from './client';
import type { Component, ComponentListItem, HierarchyResponse } from '../types';

interface ComponentListResponse {
  components: ComponentListItem[];
  total: number;
}

interface ComponentFilters {
  type?: string;
  paper?: number;
  topic?: string;
  level?: string;
  tags?: string;
  search?: string;
}

export async function getComponents(filters?: ComponentFilters) {
  const { data } = await api.get<ComponentListResponse>('/components', { params: filters });
  return data;
}

export async function getHierarchy() {
  const { data } = await api.get<HierarchyResponse>('/components/hierarchy');
  return data;
}

export async function getComponent(id: string) {
  const { data } = await api.get<Component>(`/components/${id}`);
  return data;
}
