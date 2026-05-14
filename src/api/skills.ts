import api from './client';

export interface ChangelogEntry {
  _id: string;
  version: number;
  updatedBy: string;
  summary: string;
  updatedAt: string;
}

export interface SkillsData {
  content: string;
  version: number;
  lastUpdatedBy: string;
  updatedAt: string;
  changelog: ChangelogEntry[];
}

export async function getSkills() {
  const { data } = await api.get<SkillsData>('/skills');
  return data;
}
