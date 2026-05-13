import api from './client';
import type { Meme } from '../types';

export async function getMemes(search?: string, category?: string): Promise<Meme[]> {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (category && category !== 'all') params.category = category;
  const { data } = await api.get<Meme[]>('/memes', { params });
  return data;
}
