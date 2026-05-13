import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { getHierarchy, getComponents } from '../api/components';
import { COMPONENT_TYPE_COLORS, TOPIC_NAMES } from '../types';
import type { ComponentType, HierarchyPaper } from '../types';

const TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'concept', label: 'Concept' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'worked-example', label: 'Worked Example' },
  { value: 'mistakes', label: 'Mistakes' },
  { value: 'level-benchmark', label: 'Level Benchmark' },
  { value: 'phrases', label: 'Phrases' },
  { value: 'drill', label: 'Drill' },
];

const LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'all', label: 'All' },
  { value: 'lev5+', label: 'Level 5+' },
  { value: 'lev3-4', label: 'Level 3-4' },
];

function TypeBadge({ type }: { type: ComponentType }) {
  const c = COMPONENT_TYPE_COLORS[type];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {type}
    </span>
  );
}

function PaperTree({ paper, selectedTopic, onSelectTopic }: {
  paper: HierarchyPaper;
  selectedTopic: string;
  onSelectTopic: (topic: string, paperNum: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const totalCount = paper.topics.reduce((s, t) => s + t.componentCount, 0);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-gray-50 rounded-lg transition-colors"
        style={{ color: 'var(--navy)' }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="flex-1 text-left">{paper.name}</span>
        <span className="text-xs text-gray-400">{totalCount}</span>
      </button>
      {open && (
        <div className="ml-5 space-y-0.5">
          {paper.topics.map((topic) => (
            <button
              key={topic.slug}
              onClick={() => onSelectTopic(topic.slug, paper.number)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedTopic === topic.slug
                  ? 'font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={selectedTopic === topic.slug ? { background: 'var(--cream)', color: 'var(--navy)' } : undefined}
            >
              <span className="flex-1 text-left truncate">
                {TOPIC_NAMES[topic.slug] || topic.slug}
              </span>
              <span className="text-xs text-gray-400">{topic.componentCount}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<number | undefined>();
  const [typeFilter, setTypeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const { data: hierarchy } = useQuery({
    queryKey: ['hierarchy'],
    queryFn: getHierarchy,
  });

  const filters: Record<string, string | number | undefined> = {};
  if (typeFilter) filters.type = typeFilter;
  if (levelFilter) filters.level = levelFilter;
  if (selectedPaper) filters.paper = selectedPaper;
  if (selectedTopic) filters.topic = selectedTopic;

  const { data: compData } = useQuery({
    queryKey: ['components', filters],
    queryFn: () => getComponents(filters as Record<string, string>),
  });

  function handleSelectTopic(topic: string, paper: number) {
    if (selectedTopic === topic && selectedPaper === paper) {
      setSelectedTopic('');
      setSelectedPaper(undefined);
    } else {
      setSelectedTopic(topic);
      setSelectedPaper(paper);
    }
  }

  const components = compData?.components ?? [];

  return (
    <div className="flex gap-6 min-h-[calc(100vh-7rem)]">
      {/* Left panel: hierarchy tree */}
      <div className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 p-3 overflow-y-auto">
        <h2 className="text-sm font-semibold text-gray-700 px-3 py-2">Papers</h2>
        {hierarchy?.papers.map((paper) => (
          <PaperTree
            key={paper.number}
            paper={paper}
            selectedTopic={selectedPaper === paper.number ? selectedTopic : ''}
            onSelectTopic={handleSelectTopic}
          />
        ))}
      </div>

      {/* Right panel: filtered component list */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="flex gap-1">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevelFilter(levelFilter === l.value ? '' : l.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  levelFilter === l.value
                    ? 'border-amber-400 bg-amber-50 text-amber-800 font-medium'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-400">{compData?.total ?? 0} components</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-2.5">Name</th>
                <th className="px-5 py-2.5">Type</th>
                <th className="px-5 py-2.5">Topic</th>
                <th className="px-5 py-2.5">Level</th>
                <th className="px-5 py-2.5">Tags</th>
              </tr>
            </thead>
            <tbody>
              {components.map((comp) => (
                <tr
                  key={comp._id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/knowledge/${comp._id}`)}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--navy)' }}>
                    {comp.name}
                  </td>
                  <td className="px-5 py-3"><TypeBadge type={comp.type} /></td>
                  <td className="px-5 py-3 text-gray-600">
                    {TOPIC_NAMES[comp.topic ?? ''] || comp.topic || '-'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-gray-500">{comp.level}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {comp.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {comp.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{comp.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {components.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No components found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
