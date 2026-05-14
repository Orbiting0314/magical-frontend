import api from './client';
import type { Source, SourceListItem } from '../types';

interface SourceListResponse {
  sources: SourceListItem[];
  total: number;
}

interface SourceFilters {
  type?: string;
  paper?: number;
  year?: number;
  format?: string;
  extractedStatus?: string;
  search?: string;
  tags?: string;
  tag?: string;
  limit?: number;
  skip?: number;
}

interface TagCount {
  tag: string;
  count: number;
}

export async function getSources(filters?: SourceFilters) {
  const { data } = await api.get<SourceListResponse>('/sources', { params: filters });
  return data;
}

export async function getSourceTags() {
  const { data } = await api.get<TagCount[]>('/sources/tags');
  return data;
}

export async function getSource(id: string) {
  const { data } = await api.get<Source>(`/sources/${id}`);
  return data;
}

export async function updateSource(id: string, updates: Partial<Source>) {
  const { data } = await api.patch<Source>(`/sources/${id}`, updates);
  return data;
}

export async function createSource(formData: FormData) {
  const { data } = await api.post<Source>('/sources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteSource(id: string) {
  await api.delete(`/sources/${id}`);
}

export function getSourceFileUrl(id: string) {
  return `${api.defaults.baseURL}/sources/${id}/file`;
}

export async function linkNote(sourceId: string, noteId: string) {
  const { data } = await api.post<Source>(`/sources/${sourceId}/link-note`, { noteId });
  return data;
}

export async function unlinkNote(sourceId: string, noteId: string) {
  const { data } = await api.delete<Source>(`/sources/${sourceId}/link-note/${noteId}`);
  return data;
}
