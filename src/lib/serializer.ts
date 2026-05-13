import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
import { registerEditorContainers, imageAttrsPlugin } from './containerPlugin';

const md = new MarkdownIt({ html: true, typographer: true, linkify: true });
registerEditorContainers(md);
md.use(imageAttrsPlugin);

interface ParseResult {
  html: string;
  metadataLines: string[];
}

const META_RE = /^<!--\s*(watermark|theme):\s*.+?\s*-->\s*$/;

export function markdownToHtml(markdown: string): ParseResult {
  const lines = markdown.split('\n');
  const metadataLines: string[] = [];
  const contentLines: string[] = [];

  for (const line of lines) {
    if (META_RE.test(line.trim())) {
      metadataLines.push(line);
    } else {
      contentLines.push(line);
    }
  }

  const html = md.render(contentLines.join('\n'));
  return { html, metadataLines };
}

function buildAttrsString(attrs: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) {
      parts.push(k);
    } else if (typeof v === 'string' && v.includes(' ')) {
      parts.push(`${k}="${v}"`);
    } else {
      parts.push(`${k}=${v}`);
    }
  }
  return parts.length ? `{${parts.join(' ')}}` : '';
}

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  // Container blocks: data-container divs -> :::type{attrs}\n...\n:::
  td.addRule('containerBlock', {
    filter(node) {
      return (
        node.nodeName === 'DIV' &&
        (node as HTMLElement).hasAttribute('data-container')
      );
    },
    replacement(content, node) {
      const el = node as HTMLElement;
      const type = el.getAttribute('data-container') || '';
      const rawAttrs = el.getAttribute('data-attrs');
      let attrsStr = '';
      if (rawAttrs) {
        try {
          attrsStr = buildAttrsString(JSON.parse(rawAttrs));
        } catch { /* ignore */ }
      }
      const trimmed = content.replace(/^\n+|\n+$/g, '');
      return `\n\n:::${type}${attrsStr}\n${trimmed}\n:::\n\n`;
    },
  });

  // Strip container labels (they're reconstructed from the container type)
  td.addRule('containerLabel', {
    filter(node) {
      return (
        node.nodeName === 'DIV' &&
        (node as HTMLElement).hasAttribute('data-container-label')
      );
    },
    replacement() {
      return '';
    },
  });

  // Images with data-image-attrs -> preserve the {.class} syntax
  td.addRule('imageWithAttrs', {
    filter(node) {
      return (
        node.nodeName === 'IMG' &&
        (node as HTMLElement).hasAttribute('data-image-attrs')
      );
    },
    replacement(_content, node) {
      const el = node as HTMLElement;
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      const attrs = el.getAttribute('data-image-attrs') || '';
      return `![${alt}](${src})${attrs}`;
    },
  });

  // Tables: convert back to markdown tables
  td.addRule('tableElement', {
    filter: 'table',
    replacement(_content, node) {
      const table = node as HTMLTableElement;
      const rows: string[][] = [];
      const headerRow: string[] = [];

      const thead = table.querySelector('thead');
      if (thead) {
        const ths = thead.querySelectorAll('th');
        ths.forEach((th) => headerRow.push(th.textContent?.trim() || ''));
      }

      const tbody = table.querySelector('tbody') || table;
      const trs = tbody.querySelectorAll('tr');
      trs.forEach((tr) => {
        const cells: string[] = [];
        tr.querySelectorAll('td, th').forEach((cell) => {
          cells.push(cell.textContent?.trim() || '');
        });
        if (cells.length) rows.push(cells);
      });

      if (!headerRow.length && rows.length) {
        headerRow.push(...rows.shift()!);
      }
      if (!headerRow.length) return '';

      const colCount = Math.max(headerRow.length, ...rows.map((r) => r.length));
      const pad = (arr: string[]) => {
        while (arr.length < colCount) arr.push('');
        return arr;
      };

      const header = `| ${pad(headerRow).join(' | ')} |`;
      const sep = `| ${pad(Array(colCount).fill('---')).join(' | ')} |`;
      const body = rows.map((r) => `| ${pad(r).join(' | ')} |`).join('\n');

      return `\n\n${header}\n${sep}\n${body}\n\n`;
    },
  });

  // Remove thead/tbody/tr/td/th so they don't interfere
  for (const tag of ['thead', 'tbody', 'tr', 'td', 'th'] as const) {
    td.addRule(`skip-${tag}`, {
      filter: tag as TurndownService.TagName,
      replacement(content) {
        return content;
      },
    });
  }

  return td;
}

const turndown = createTurndown();

export function htmlToMarkdown(html: string, metadataLines: string[]): string {
  let markdown = turndown.turndown(html);

  // Clean up excessive blank lines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  if (metadataLines.length) {
    markdown = metadataLines.join('\n') + '\n\n' + markdown;
  }

  return markdown + '\n';
}
