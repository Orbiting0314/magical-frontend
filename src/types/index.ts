export type ComponentType =
  | 'concept'
  | 'strategy'
  | 'worked-example'
  | 'mistakes'
  | 'level-benchmark'
  | 'phrases'
  | 'drill';

export interface ComponentListItem {
  _id: string;
  name: string;
  file: string;
  type: ComponentType;
  paper: number | null;
  topic: string | null;
  level: 'all' | 'lev5+' | 'lev3-4';
  tags: string[];
  updatedAt: string;
}

export interface Component extends ComponentListItem {
  content: string;
  createdAt: string;
}

export interface NoteListItem {
  _id: string;
  title: string;
  paper: number;
  topic: string;
  level: string;
  set: string | null;
  status: 'draft' | 'published';
  updatedAt: string;
}

export interface Note extends NoteListItem {
  markdown: string;
  sourceFile: string | null;
  componentsUsed: string[];
  createdAt: string;
}

export interface AnswerKeyListItem {
  _id: string;
  paper: number;
  topic: string;
  set: string;
  level: string;
  title: string;
  updatedAt: string;
}

export interface Answer {
  number: number;
  year: number;
  question: string;
  answer: string;
}

export interface AnswerKey extends AnswerKeyListItem {
  markdown: string;
  answers: Answer[];
  noteId: string | null;
  createdAt: string;
}

export type MemeCategory = 'reaction' | 'comparison' | 'ranking' | 'approval' | 'frustration' | 'celebration' | 'other';

export interface Meme {
  _id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  tags: string[];
  category: MemeCategory;
  imgflipId: string;
}

export const MEME_CATEGORIES: { value: MemeCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'approval', label: 'Approval' },
  { value: 'frustration', label: 'Frustration' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'other', label: 'Other' },
];

export interface HierarchyTopic {
  slug: string;
  name: string;
  levels: string[];
  componentCount: number;
}

export interface HierarchyPaper {
  number: number;
  name: string;
  topics: HierarchyTopic[];
}

export interface HierarchyResponse {
  papers: HierarchyPaper[];
}

export const COMPONENT_TYPE_COLORS: Record<ComponentType, { bg: string; text: string; border: string }> = {
  concept:           { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-400' },
  strategy:          { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-400' },
  'worked-example':  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-400' },
  mistakes:          { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-400' },
  'level-benchmark': { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-400' },
  phrases:           { bg: 'bg-teal-100',   text: 'text-teal-800',   border: 'border-teal-400' },
  drill:             { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-400' },
};

export const PAPER_NAMES: Record<number, string> = {
  1: 'Paper 1 - Reading',
  2: 'Paper 2 - Writing',
  3: 'Paper 3 - Listening & Integrated',
  4: 'Paper 4 - Speaking',
};

export const TOPIC_NAMES: Record<string, string> = {
  'short-answer': 'Short Answer',
  'reference': 'Reference Questions',
  'true-false-not-given': 'True / False / Not Given',
  'multiple-choice': 'Multiple Choice',
  'summary-cloze': 'Summary Cloze',
  'vocabulary-meaning': 'Vocabulary & Meaning',
  'inference': 'Inference',
  'writers-tone-attitude': "Writer's Tone & Attitude",
  'matching-sequencing': 'Matching & Sequencing',
  'open-ended-response': 'Open-ended Response',
  'overview-and-strategy': 'Overview & Strategy',
  'letter-to-editor': 'Letter to the Editor',
  'letter-of-advice': 'Letter of Advice',
  'argumentative-essay': 'Argumentative Essay',
  'article': 'Article',
  'speech': 'Speech',
  'report': 'Report',
  'proposal': 'Proposal',
  'blog-post': 'Blog Post',
  'letter-of-complaint': 'Letter of Complaint',
  'short-story': 'Short Story',
  'review': 'Review',
  'formal-letter': 'Formal Letter',
  'complaint-letter': 'Complaint Letter',
  'recommendation': 'Recommendation',
  'rejection-letter': 'Rejection Letter',
  'event-update': 'Event Update',
  'agree-disagree': 'Agree / Disagree',
  'advantages-disadvantages': 'Advantages & Disadvantages',
  'cause-effect': 'Cause & Effect',
  'giving-advice': 'Giving Advice',
  'hypothetical': 'Hypothetical',
  'making-comparisons': 'Making Comparisons',
  'prioritising-ranking': 'Prioritising & Ranking',
  'problem-solution': 'Problem & Solution',
  'general-speaking-skills': 'General Speaking Skills',
  'topic-year-map': 'Topic-Year Map',
  'text-type-year-map': 'Text Type Year Map',
};
