import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
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

function PaperTree({ paper, selectedTopic, selectedPaper, onSelectTopic }: {
  paper: HierarchyPaper;
  selectedTopic: string;
  selectedPaper: number | undefined;
  onSelectTopic: (topic: string, paperNum: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const totalCount = paper.topics.reduce((s, t) => s + t.componentCount, 0);
  const isPaperSelected = selectedPaper === paper.number;

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors"
        style={{ background: isPaperSelected ? 'var(--pink-light)' : undefined }}
        style={{ color: 'var(--navy)' }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="flex-1 text-left">{paper.name}</span>
        <span className="text-xs text-gray-400">{totalCount}</span>
      </button>
      {open && (
        <div className="ml-5 space-y-0.5">
          {paper.topics.map((topic) => {
            const isActive = isPaperSelected && selectedTopic === topic.slug;
            return (
              <button
                key={topic.slug}
                onClick={() => onSelectTopic(topic.slug, paper.number)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'font-semibold'
                    : 'text-gray-600'
                }`}
                style={isActive ? { background: 'var(--pink-light)', color: 'var(--pink-dark)', borderLeft: '3px solid var(--pink)' } : undefined}
              >
                <span className="flex-1 text-left truncate">
                  {TOPIC_NAMES[topic.slug] || topic.slug}
                </span>
                <span className="text-xs" style={{ color: isActive ? 'var(--pink-dark)' : undefined }}>
                  {topic.componentCount}
                </span>
              </button>
            );
          })}
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
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 250);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data: hierarchy } = useQuery({
    queryKey: ['hierarchy'],
    queryFn: getHierarchy,
  });

  const filters: Record<string, string | number | undefined> = {};
  if (typeFilter) filters.type = typeFilter;
  if (levelFilter) filters.level = levelFilter;
  if (selectedPaper) filters.paper = selectedPaper;
  if (selectedTopic) filters.topic = selectedTopic;
  if (debouncedSearch) filters.search = debouncedSearch;
  if (tagFilter) filters.tags = tagFilter;

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

  function handleTagClick(tag: string) {
    setTagFilter(prev => prev === tag ? '' : tag);
  }

  function clearFilters() {
    setSearchText('');
    setTypeFilter('');
    setLevelFilter('');
    setTagFilter('');
    setSelectedTopic('');
    setSelectedPaper(undefined);
  }

  const components = compData?.components ?? [];
  const hasFilters = searchText || typeFilter || levelFilter || tagFilter || selectedTopic;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-7rem)]">
      {/* Left panel: hierarchy tree */}
      <div className="w-72 shrink-0 card p-3 overflow-y-auto">
        <h2 className="text-sm font-semibold text-gray-700 px-3 py-2">Papers</h2>
        {hierarchy?.papers.map((paper) => (
          <PaperTree
            key={paper.number}
            paper={paper}
            selectedTopic={selectedTopic}
            selectedPaper={selectedPaper}
            onSelectTopic={handleSelectTopic}
          />
        ))}
        {selectedTopic && (
          <button
            onClick={() => { setSelectedTopic(''); setSelectedPaper(undefined); }}
            className="w-full flex items-center justify-center gap-1 mt-3 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X size={12} />
            Clear topic filter
          </button>
        )}
      </div>

      {/* Right panel: filtered component list */}
      <div className="flex-1 space-y-4">
        {/* Search + filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search components..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
              style={{ border: '1px solid var(--pink-light)' }}
            />
          </div>
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
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                style={levelFilter === l.value
                  ? { borderColor: 'var(--pink)', background: 'var(--pink-light)', color: 'var(--pink-dark)', fontWeight: 500 }
                  : { borderColor: '#f0e8e0' }
                }
              >
                {l.label}
              </button>
            ))}
          </div>
          {tagFilter && (
            <button
              onClick={() => setTagFilter('')}
              className="tag-pill flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium"
            >
              tag: {tagFilter}
              <X size={11} />
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{compData?.total ?? 0} components</span>
        </div>

        <div className="card overflow-hidden">
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
                  className="border-b cursor-pointer transition-colors"
                  style={{ borderColor: '#f8f0ea' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pink-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
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
                        <button
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); handleTagClick(tag); }}
                          className="tag-pill transition-colors"
                          style={tagFilter === tag ? { background: 'var(--pink)', color: 'white', fontWeight: 500 } : undefined}
                        >
                          {tag}
                        </button>
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
                  <td colSpan={5} className="px-5 py-12 text-center">
                    {hasFilters ? (
                      <div className="space-y-2">
                        <Search size={28} className="mx-auto text-gray-300" />
                        <p className="text-sm text-gray-400">No components match your filters</p>
                        <button
                          onClick={clearFilters}
                          className="text-xs font-medium"
                          style={{ color: 'var(--pink-dark)' }}
                        >
                          Clear all filters
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No components found</p>
                    )}
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
