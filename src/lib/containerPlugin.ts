import type MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';

const CONTAINER_NAMES = [
  'question', 'skill', 'warning', 'hkeaa', 'training',
  'answer', 'level-compare', 'rubric', 'phrases', 'exam-sample',
] as const;

const CONTAINER_LABELS: Record<string, string> = {
  question: 'Question',
  skill: 'Key Skill',
  warning: 'Common Mistake',
  hkeaa: 'HKEAA Remarks',
  training: 'Training',
  answer: 'Answer',
  'level-compare': 'Level Compare',
  rubric: 'Rubric',
  phrases: 'Phrases',
  'exam-sample': 'Exam Sample',
};

function parseAttrs(info: string, name: string): Record<string, string | boolean> {
  const rest = info.slice(name.length).trim();
  const m = rest.match(/^\{([^}]*)\}/);
  if (!m) return {};
  const attrs: Record<string, string | boolean> = {};
  for (const pair of m[1].split(/\s+/).filter(Boolean)) {
    const eq = pair.indexOf('=');
    if (eq === -1) {
      attrs[pair] = true;
    } else {
      attrs[pair.slice(0, eq)] = pair.slice(eq + 1).replace(/^["']|["']$/g, '');
    }
  }
  return attrs;
}

export function registerEditorContainers(md: MarkdownIt) {
  for (const name of CONTAINER_NAMES) {
    md.use(container, name, {
      validate: (params: string) => params.trim().split(/[{\s]/)[0] === name,
      render(tokens: any[], idx: number) {
        if (tokens[idx].nesting === 1) {
          const attrs = parseAttrs(tokens[idx].info.trim(), name);
          const attrsJson = Object.keys(attrs).length
            ? ` data-attrs='${JSON.stringify(attrs)}'`
            : '';
          const label = CONTAINER_LABELS[name] || name;
          return `<div data-container="${name}"${attrsJson}>\n<div data-container-label="${name}">${label}</div>\n`;
        }
        return '</div>\n';
      },
    });
  }
}

export function imageAttrsPlugin(md: MarkdownIt) {
  md.core.ruler.after('inline', 'image_attrs', (state: any) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue;
      const children = block.children;
      for (let i = 0; i < children.length; i++) {
        if (children[i].type !== 'image') continue;
        const next = children[i + 1];
        if (!next || next.type !== 'text') continue;
        const m = next.content.match(/^\{([^}]+)\}/);
        if (!m) continue;

        const classes: string[] = [];
        for (const tok of m[1].split(/\s+/)) {
          if (tok.startsWith('.')) classes.push(tok.slice(1));
        }
        if (classes.length) {
          children[i].attrJoin('class', classes.join(' '));
          children[i].attrSet('data-image-attrs', m[0]);
        }
        next.content = next.content.slice(m[0].length);
      }
    }
  });
}
