import api from './client';
import type { AnswerKey, AnswerKeyListItem } from '../types';

interface AnswerKeyListResponse {
  answerKeys: AnswerKeyListItem[];
  total: number;
}

export async function getAnswerKeys(filters?: { paper?: number; topic?: string; set?: string }) {
  const { data } = await api.get<AnswerKeyListResponse>('/answer-keys', { params: filters });
  return data;
}

export async function getAnswerKey(id: string) {
  const { data } = await api.get<AnswerKey>(`/answer-keys/${id}`);
  return data;
}
