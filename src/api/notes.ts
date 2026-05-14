import api from './client';
import type { Note, NoteListItem, NoteVersionSummary, NoteVersion } from '../types';

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

export async function createNote(data: { title: string; paper: number; topic: string; level?: string }) {
  const { data: note } = await api.post<Note>('/notes', data);
  return note;
}

interface NoteUpdate extends Partial<Pick<Note, 'markdown' | 'status' | 'title'>> {
  addComponentUsed?: string[];
}

export async function updateNote(id: string, updates: NoteUpdate) {
  const { data } = await api.put<Note>(`/notes/${id}`, updates);
  return data;
}

export async function getNoteVersions(id: string) {
  const { data } = await api.get<{ versions: NoteVersionSummary[]; total: number }>(`/notes/${id}/versions`);
  return data;
}

export async function getNoteVersion(noteId: string, versionId: string) {
  const { data } = await api.get<NoteVersion>(`/notes/${noteId}/versions/${versionId}`);
  return data;
}

export async function restoreNoteVersion(noteId: string, versionId: string) {
  const { data } = await api.post<Note>(`/notes/${noteId}/versions/${versionId}/restore`);
  return data;
}
