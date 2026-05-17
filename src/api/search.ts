import api from './client';

interface SearchResults {
  notes: { _id: string; title: string; paper: number; topic: string; level: string; updatedAt: string }[];
  sources: { _id: string; title: string; type: string; paper: number | null }[];
  components: { _id: string; name: string; type: string; paper: number | null; topic: string | null }[];
}

export async function globalSearch(q: string) {
  const { data } = await api.get<SearchResults>('/search', { params: { q } });
  return data;
}
