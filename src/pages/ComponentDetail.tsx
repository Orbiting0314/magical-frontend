import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { marked } from 'marked';
import { getComponent } from '../api/components';
import { COMPONENT_TYPE_COLORS, PAPER_NAMES, TOPIC_NAMES } from '../types';

export default function ComponentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: component, isLoading } = useQuery({
    queryKey: ['component', id],
    queryFn: () => getComponent(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-gray-400 text-sm py-8 text-center">Loading...</div>;
  }

  if (!component) {
    return <div className="text-gray-400 text-sm py-8 text-center">Component not found</div>;
  }

  const typeColor = COMPONENT_TYPE_COLORS[component.type];
  const html = marked.parse(component.content, { async: false }) as string;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/knowledge')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Knowledge Base
        </button>
        <span className="text-gray-300">/</span>
        <span style={{ color: 'var(--navy)' }}>{component.name}</span>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 card overflow-hidden">
          <div className="flex items-center justify-end px-6 pt-4 pb-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(component.content).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy Markdown'}
            </button>
          </div>
          <div className="px-6 pb-6 pt-3">
            <div
              className="md-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="w-64 shrink-0 space-y-4">
          <div className="card p-5 space-y-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Type</div>
              <span className={`px-2.5 py-1 rounded text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                {component.type}
              </span>
            </div>

            {component.paper && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Paper</div>
                <div className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
                  {PAPER_NAMES[component.paper] || `Paper ${component.paper}`}
                </div>
              </div>
            )}

            {component.topic && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Topic</div>
                <div className="text-sm" style={{ color: 'var(--navy-light)' }}>
                  {TOPIC_NAMES[component.topic] || component.topic}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Level</div>
              <div className="text-sm text-gray-600">
                {component.level === 'all' ? 'All levels' : component.level}
              </div>
            </div>

            {component.tags.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {component.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last modified</div>
              <div className="text-xs text-gray-500">
                {new Date(component.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
