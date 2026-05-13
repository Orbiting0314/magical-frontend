import api from './client';
import type { Note, NoteListItem } from '../types';

interface NoteListResponse {
  notes: NoteListItem[];
  total: number;
}

export async function getNotes(filters?: { paper?: number; topic?: string; level?: string; status?: string }) {
  const { data } = await api.get<NoteListResponse>('/notes', { params: filters });
  return data;
}

export async function getNote(id: string) {
  const { data } = await api.get<Note>(`/notes/${id}`);
  return data;
}

export async function updateNote(id: string, updates: Partial<Pick<Note, 'markdown' | 'status' | 'title'>>) {
  const { data } = await api.put<Note>(`/notes/${id}`, updates);
  return data;
}
