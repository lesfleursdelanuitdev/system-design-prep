// Turns lesson MDX and plain markdown strings (exercise feedback, model answers, the
// reference design) into React elements. Runs at build time only.
import { evaluate } from '@mdx-js/mdx';
import rehypeShikiFromHighlighter from '@shikijs/rehype/core';
import type { Element, Root as HastRoot } from 'hast';
import { toJsxRuntime, type Components } from 'hast-util-to-jsx-runtime';
import type { ReactElement, ReactNode } from 'react';
import * as runtime from 'react/jsx-runtime';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { createHighlighter, type HighlighterGeneric } from 'shiki';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { remarkDiagramCode, remarkLessonSections } from './remark';

const LANGS = ['yaml', 'json', 'typescript', 'tsx', 'javascript', 'bash', 'http', 'sql', 'markdown', 'diff', 'protobuf', 'text'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let highlighter: Promise<HighlighterGeneric<any, any>> | undefined;
function getHighlighter() {
  highlighter ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: LANGS,
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

async function shikiPlugin() {
  const h = await getHighlighter();
  return [
    rehypeShikiFromHighlighter,
    h,
    {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      fallbackLanguage: 'text',
      defaultLanguage: 'text',
    },
  ] as const;
}

/** Compiles one lesson's MDX body into a component. */
export async function compileLesson(source: string) {
  const shiki = await shikiPlugin();
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkDiagramCode, remarkLessonSections],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rehypePlugins: [rehypeSlug, shiki as any],
  });
  return Content;
}

/** Marks ```mermaid fences so they render as diagrams instead of code. */
function rehypeMermaid() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      const code = node.children[0];
      if (!code || code.type !== 'element' || code.tagName !== 'code') return;
      const cls = code.properties?.className;
      if (!Array.isArray(cls) || !cls.includes('language-mermaid')) return;
      const text = code.children.map((c) => (c.type === 'text' ? c.value : '')).join('');
      parent.children[index] = { type: 'element', tagName: 'mermaid-diagram', properties: { code: text }, children: [] };
    });
  };
}

export type MarkdownComponents = Partial<Components> & Record<string, unknown>;

/** Renders a markdown string (GitHub flavour, no JSX) to React elements. */
export async function renderMarkdown(md: string, components: MarkdownComponents = {}): Promise<ReactElement> {
  const shiki = await shikiPlugin();
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeMermaid)
    .use(rehypeSlug)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .use(...(shiki as unknown as [any, any, any]));
  const tree = (await processor.run(processor.parse(md))) as HastRoot;
  return toJsxRuntime(tree, {
    Fragment: runtime.Fragment,
    jsx: runtime.jsx,
    jsxs: runtime.jsxs,
    components: components as Partial<Components>,
  }) as ReactElement;
}

/** Renders a short markdown string without the wrapping paragraph (for one-line text). */
export async function renderInline(md: string, components: MarkdownComponents = {}): Promise<ReactNode> {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);
  const tree = (await processor.run(processor.parse(md))) as HastRoot;
  const only = tree.children.filter((c) => !(c.type === 'text' && c.value.trim() === ''));
  if (only.length === 1 && only[0].type === 'element' && only[0].tagName === 'p') {
    tree.children = only[0].children;
  }
  return toJsxRuntime(tree, {
    Fragment: runtime.Fragment,
    jsx: runtime.jsx,
    jsxs: runtime.jsxs,
    components: components as Partial<Components>,
  });
}
