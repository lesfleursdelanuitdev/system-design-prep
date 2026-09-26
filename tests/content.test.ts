// Content validation: every lesson follows the lesson format (PLAN.md §5) and the
// definition of done (§10). Run just one unit with UNIT=3 npx vitest run tests/content.
import type { Root, RootContent, Heading, Link } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { describe, expect, it } from 'vitest';
import { EXERCISE_COMPONENTS_LIST, LESSON_COMPONENTS_LIST } from '@/lib/component-names';
import { getExercises, getGlossary, getGlossaryMap, getLessons, getUnits } from '@/lib/content';
import { compileLesson } from '@/lib/markdown';
import { LESSON_PARTS, partForHeading } from '@/lib/remark';

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);
const onlyUnit = process.env.UNIT ? Number(process.env.UNIT) : undefined;

/** Words a reader reads: prose and component text, not code, diagrams or exercise data. */
export function wordCount(tree: Root): number {
  let words = 0;
  visit(tree, (node) => {
    if (node.type === 'text') words += (node as { value: string }).value.split(/\s+/).filter(Boolean).length;
    if (node.type === 'inlineCode') words += 1;
  });
  return words;
}

type Jsx = MdxJsxFlowElement | MdxJsxTextElement;
function jsxNodes(tree: Root): Jsx[] {
  const out: Jsx[] = [];
  visit(tree, (n) => {
    if (n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement') out.push(n as Jsx);
  });
  return out;
}
function attr(el: Jsx, name: string): string | undefined {
  const a = el.attributes.find((x) => x.type === 'mdxJsxAttribute' && x.name === name);
  return a && typeof a.value === 'string' ? a.value : undefined;
}

const EXERCISE_TYPE: Record<string, string> = { Quiz: 'quiz', Sort: 'sort', WriteIt: 'write', ScenarioExercise: 'scenario', DiagramExercise: 'diagram' };
const PAGES = new Set(['/', '/glossary/', '/tools/', '/playground/', '/capstone/']);
const HTML_OK = new Set(['br', 'sup', 'sub', 'kbd', 'abbr', 'small']);

describe('course data', () => {
  it('loads units, lessons, glossary and exercises', () => {
    expect(getUnits().length).toBeGreaterThan(0);
    expect(getLessons().length).toBeGreaterThan(0);
    expect(getGlossary().length).toBeGreaterThan(0);
    expect(getExercises().size).toBeGreaterThan(0);
  });

  it('glossary ids and terms are unique, and "see" links exist', () => {
    const g = getGlossary();
    const ids = g.map((e) => e.id);
    expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
    const terms = g.map((e) => e.term.toLowerCase());
    expect(terms.filter((x, i) => terms.indexOf(x) !== i)).toEqual([]);
    const map = getGlossaryMap();
    const broken = g.flatMap((e) => (e.see ?? []).filter((s) => !map.has(s)).map((s) => `${e.id} → ${s}`));
    expect(broken).toEqual([]);
  });

  it('every planned lesson has been written', () => {
    if (onlyUnit || process.env.ALLOW_MISSING_LESSONS) return;
    const written = new Set(getLessons().map((l) => l.id));
    const missing = getUnits().flatMap((u) => u.lessons.map((s) => `${u.slug}/${s}`)).filter((id) => !written.has(id));
    expect(missing).toEqual([]);
  });

  it('lesson orders within a unit are 1, 2, 3… with no gaps', () => {
    for (const u of getUnits()) {
      const orders = getLessons()
        .filter((l) => l.unit === u.number)
        .map((l) => l.order);
      expect(orders, `unit ${u.number}`).toEqual(orders.map((_, i) => i + 1));
    }
  });

  it('every exercise is used by exactly one lesson', () => {
    if (onlyUnit) return;
    const used = new Map<string, string[]>();
    for (const l of getLessons()) {
      for (const el of jsxNodes(parser.parse(l.body) as Root)) {
        const id = el.name && EXERCISE_TYPE[el.name] ? attr(el, 'id') : undefined;
        if (id) used.set(id, [...(used.get(id) ?? []), l.id]);
      }
    }
    const unused = [...getExercises().keys()].filter((id) => !used.has(id));
    const twice = [...used.entries()].filter(([, ls]) => ls.length > 1).map(([id, ls]) => `${id}: ${ls.join(', ')}`);
    expect(unused, 'exercises no lesson uses').toEqual([]);
    expect(twice, 'exercises used more than once').toEqual([]);
  });
});

const lessons = getLessons().filter((l) => !onlyUnit || l.unit === onlyUnit);
// Links may point at any planned lesson, written yet or not.
const hrefs = new Set(getUnits().flatMap((u) => u.lessons.map((slug) => `/learn/${u.slug}/${slug}/`)));
const unitHrefs = new Set(getUnits().map((u) => `/learn/${u.slug}/`));

describe.each(lessons.map((l) => [l.file, l] as const))('%s', (_file, lesson) => {
  const tree = parser.parse(lesson.body) as Root;
  const h2s = tree.children.filter((n): n is Heading => n.type === 'heading' && (n as Heading).depth === 2);
  const glossary = getGlossaryMap();
  const exercises = getExercises();

  it('has the lesson parts, in order', () => {
    const parts = h2s.map((h) => partForHeading(toString(h))).filter((p) => p !== 'extra');
    expect(parts).toEqual(LESSON_PARTS.map((p) => p.part));
    expect(tree.children[0]?.type === 'heading', 'starts with "## In one sentence"').toBe(true);
  });

  it('keeps "In one sentence" to one or two sentences', () => {
    const i = tree.children.indexOf(h2s[0]);
    const next = tree.children.indexOf(h2s[1]);
    const text = tree.children
      .slice(i + 1, next)
      .map((n) => toString(n))
      .join(' ');
    const sentences = text.split(/[.!?](\s|$)/).filter((s) => s.trim().length > 3).length;
    expect(sentences).toBeGreaterThanOrEqual(1);
    expect(sentences).toBeLessThanOrEqual(2);
  });

  it('uses only known components', () => {
    const bad = jsxNodes(tree)
      .map((e) => e.name ?? '<fragment>')
      .filter((n) => !(LESSON_COMPONENTS_LIST as readonly string[]).includes(n) && !HTML_OK.has(n));
    expect(bad).toEqual([]);
  });

  it('links only to glossary terms that exist', () => {
    const ids = jsxNodes(tree)
      .filter((e) => e.name === 'Term')
      .map((e) => attr(e, 'id') ?? '(missing id)');
    expect(ids.filter((id) => !glossary.has(id))).toEqual([]);
    expect(lesson.terms.filter((id) => !glossary.has(id)), 'frontmatter terms').toEqual([]);
    expect(lesson.terms.length, 'frontmatter lists its key terms').toBeGreaterThan(0);
  });

  it('gives every diagram a text description, and keeps Mermaid inside <Diagram>', () => {
    for (const d of jsxNodes(tree).filter((e) => e.name === 'Diagram')) {
      expect((attr(d, 'description') ?? '').length, 'description').toBeGreaterThan(40);
      const code = d.children.find((c) => c.type === 'code') as { lang?: string } | undefined;
      expect(code?.lang, 'a ```mermaid fence inside <Diagram>').toBe('mermaid');
    }
    const loose: string[] = [];
    visit(tree, 'code', (node, _i, parent) => {
      if (node.lang === 'mermaid' && !(parent && parent.type === 'mdxJsxFlowElement' && (parent as Jsx).name === 'Diagram')) loose.push(node.value.slice(0, 40));
    });
    expect(loose).toEqual([]);
  });

  it('refers only to exercises that exist, with the right component', () => {
    for (const el of jsxNodes(tree).filter((e) => e.name && EXERCISE_TYPE[e.name])) {
      const id = attr(el, 'id');
      expect(id, `${el.name} needs an id`).toBeTruthy();
      const ex = exercises.get(id!);
      expect(ex, `content/exercises/${id}.yaml`).toBeDefined();
      expect(ex!.type, `${id} used with <${el.name}>`).toBe(EXERCISE_TYPE[el.name!]);
    }
  });

  it('ends with at least one exercise under "Try it"', () => {
    const tryIt = h2s.find((h) => partForHeading(toString(h)) === 'try-it')!;
    const after = tree.children.slice(tree.children.indexOf(tryIt) + 1);
    const names: string[] = [];
    for (const n of after) visit(n as RootContent, (x) => {
      if ((x.type === 'mdxJsxFlowElement' || x.type === 'mdxJsxTextElement') && (x as Jsx).name) names.push((x as Jsx).name!);
    });
    expect(names.some((n) => EXERCISE_COMPONENTS_LIST.includes(n))).toBe(true);
  });

  it('links only to pages that exist', () => {
    const bad: string[] = [];
    visit(tree, 'link', (l: Link) => {
      if (!l.url.startsWith('/')) return;
      const [pathPart, hash] = l.url.split('#');
      const p = pathPart.endsWith('/') ? pathPart : `${pathPart}/`;
      if (pathPart === '/glossary' || pathPart === '/glossary/') {
        if (hash && !glossary.has(hash)) bad.push(l.url);
        return;
      }
      if (!hrefs.has(p) && !unitHrefs.has(p) && !PAGES.has(p) && !PAGES.has(pathPart)) bad.push(l.url);
    });
    expect(bad).toEqual([]);
  });

  it('can be read in about ten minutes', () => {
    const words = wordCount(tree);
    expect(words, 'words').toBeLessThanOrEqual(2000);
    expect(words, 'words').toBeGreaterThanOrEqual(350);
    expect(lesson.minutes, `minutes for ${words} words`).toBeGreaterThanOrEqual(Math.max(3, Math.floor(words / 260)));
  });

  it('compiles', async () => {
    await expect(compileLesson(lesson.body)).resolves.toBeTypeOf('function');
  });
});
