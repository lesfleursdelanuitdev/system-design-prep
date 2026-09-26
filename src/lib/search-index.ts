// Builds the search index from the lesson sources and the glossary (build time only).
import GithubSlugger from 'github-slugger';
import type { Root, RootContent, Heading } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { getGlossary, getLessons } from './content';
import type { SearchDoc } from './search';

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

/** Plain text of a node, including the text-valued props of lesson components (titles, descriptions). */
function textOf(node: RootContent | Root): string {
  if (node.type === 'code' || node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression') return '';
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    const el = node as MdxJsxFlowElement | MdxJsxTextElement;
    const props = el.attributes
      .filter((a) => a.type === 'mdxJsxAttribute' && typeof a.value === 'string' && ['title', 'description', 'caption'].includes(a.name))
      .map((a) => a.value as string);
    return [...props, ...el.children.map((c) => textOf(c as RootContent))].join(' ');
  }
  if ('children' in node) return (node.children as RootContent[]).map(textOf).join(node.type === 'paragraph' ? '' : ' ');
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  return toString(node);
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const lesson of getLessons()) {
    const context = `Unit ${lesson.unit} · ${lesson.unitTitle}`;
    const tree = parser.parse(lesson.body) as Root;
    const slugger = new GithubSlugger();
    let heading: { text: string; id: string } | null = null;
    let buf: string[] = [];
    const intro: string[] = [];
    const flush = () => {
      if (!heading) return;
      const text = squash(buf.join(' '));
      if (text) docs.push({ kind: 'section', title: lesson.title, heading: heading.text, context, href: `${lesson.href}#${heading.id}`, text });
      buf = [];
    };
    for (const node of tree.children) {
      if (node.type === 'heading' && (node as Heading).depth <= 3) {
        flush();
        const text = toString(node);
        heading = { text, id: slugger.slug(text) };
      } else if (node.type === 'heading') {
        slugger.slug(toString(node));
        (heading ? buf : intro).push(toString(node));
      } else {
        (heading ? buf : intro).push(textOf(node));
      }
    }
    flush();
    docs.push({ kind: 'lesson', title: lesson.title, context, href: lesson.href, text: squash(`${lesson.summary} ${intro.join(' ')}`) });
  }
  for (const entry of getGlossary()) {
    docs.push({
      kind: 'term',
      title: entry.term,
      context: 'Glossary',
      href: `/glossary/#${entry.id}`,
      text: squash([entry.short, entry.long ?? '', (entry.aka ?? []).join(' ')].join(' ')),
    });
  }
  docs.push(
    { kind: 'page', title: 'Diagram playground', context: 'Tools', href: '/playground/', text: 'Mermaid editor with live preview and starter templates: class, sequence, state, ER, C4-style diagrams.' },
    { kind: 'page', title: 'Capstone: design Shelf on one page', context: 'Capstone', href: '/capstone/', text: 'A guided form that produces a one-page design document in markdown, with a reference design to compare against.' },
    { kind: 'page', title: 'Tools', context: 'Tools', href: '/tools/', text: 'Estimation calculator, availability calculator, quality-scenario builder, contract builder (OpenAPI, JSON Schema, Zod).' },
  );
  return docs;
}
