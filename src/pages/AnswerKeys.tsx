import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getAnswerKeys, getAnswerKey } from '../api/answerKeys';
import { PAPER_NAMES, TOPIC_NAMES } from '../types';
import type { AnswerKeyListItem, Answer } from '../types';

function AnswerTable({ answers }: { answers: Answer[] }) {
  return (
    <table className="w-full text-sm mt-2">
      <thead>
        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
          <th className="px-4 py-2 w-12">#</th>
          <th className="px-4 py-2 w-16">Year</th>
          <th className="px-4 py-2">Question</th>
          <th className="px-4 py-2">Answer</th>
        </tr>
      </thead>
      <tbody>
        {answers.map((a, i) => (
          <tr key={i} className="border-b border-gray-50">
            <td className="px-4 py-2 text-gray-400">{a.number}</td>
            <td className="px-4 py-2 text-gray-500">{a.year}</td>
            <td className="px-4 py-2 text-gray-700">{a.question}</td>
            <td className="px-4 py-2 font-medium" style={{ color: 'var(--navy)' }}>{a.answer}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AnswerKeyRow({ item }: { item: AnswerKeyListItem }) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail } = useQuery({
    queryKey: ['answer-key', item._id],
    queryFn: () => getAnswerKey(item._id),
    enabled: expanded,
  });

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-3 text-sm hover:bg-gray-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}
        <span className="flex-1 text-left font-medium" style={{ color: 'var(--navy)' }}>
          {item.title}
        </span>
        {item.set && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{item.set}</span>
        )}
        <span className="text-xs text-gray-400">
          {TOPIC_NAMES[item.topic] || item.topic}
        </span>
      </button>
      {expanded && detail?.answers && (
        <div className="px-5 pb-4">
          <AnswerTable answers={detail.answers} />
        </div>
      )}
    </div>
  );
}

export default function AnswerKeys() {
  const { data } = useQuery({
    queryKey: ['answer-keys'],
    queryFn: () => getAnswerKeys(),
  });

  const answerKeys = data?.answerKeys ?? [];

  const grouped = answerKeys.reduce<Record<number, AnswerKeyListItem[]>>((acc, ak) => {
    if (!acc[ak.paper]) acc[ak.paper] = [];
    acc[ak.paper].push(ak);
    return acc;
  }, {});

  const papers = Object.keys(grouped).map(Number).sort();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--navy)' }}>Answer Keys</h1>

      {papers.length === 0 && (
        <div className="text-gray-400 text-sm py-8 text-center">No answer keys found</div>
      )}

      {papers.map((paper) => (
        <PaperGroup key={paper} paper={paper} items={grouped[paper]} />
      ))}
    </div>
  );
}

function PaperGroup({ paper, items }: { paper: number; items: AnswerKeyListItem[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
          {PAPER_NAMES[paper] || `Paper ${paper}`}
        </span>
        <span className="text-xs text-gray-400">{items.length} sets</span>
      </button>
      {open && (
        <div>
          {items.map((item) => (
            <AnswerKeyRow key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
