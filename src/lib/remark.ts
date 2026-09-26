// Remark plugins used when lessons are compiled.
import type { Root, RootContent, Heading, Code } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxAttribute } from 'mdast-util-mdx-jsx';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';

/** The sections every lesson has, in order (see PLAN.md §5). "Key terms" is added by the page. */
export const LESSON_PARTS = [
  { label: 'In one sentence', part: 'one-sentence' },
  { label: 'Example', part: 'example' },
  { label: 'The general idea', part: 'general-idea' },
  { label: 'Common mistakes', part: 'mistakes' },
  { label: 'Try it', part: 'try-it' },
] as const;

export function partForHeading(text: string): string {
  const t = text.trim().toLowerCase();
  for (const p of LESSON_PARTS) {
    const label = p.label.toLowerCase();
    if (t === label || t.startsWith(label + ':') || t.startsWith(label + ' ')) return p.part;
  }
  return 'extra';
}

function attr(name: string, value: string): MdxJsxAttribute {
  return { type: 'mdxJsxAttribute', name, value };
}

/**
 * Lets authors write a Mermaid diagram as a fenced code block inside <Diagram>:
 *
 *   <Diagram title="…" description="…">
 *   ```mermaid
 *   flowchart LR …
 *   ```
 *   </Diagram>
 *
 * The fence becomes the component's `code` prop.
 */
export function remarkDiagramCode() {
  return (tree: Root) => {
    visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
      if (node.name !== 'Diagram') return;
      const idx = node.children.findIndex((c) => c.type === 'code');
      if (idx === -1) return;
      const code = node.children[idx] as Code;
      node.attributes.push(attr('code', code.value));
      node.children.splice(idx, 1);
    });
  };
}

/**
 * Wraps each `##` section in <section data-part="…"> so the lesson parts can be styled
 * (the "In one sentence" box, the "Try it" panel).
 */
export function remarkLessonSections() {
  return (tree: Root) => {
    const out: RootContent[] = [];
    let current: MdxJsxFlowElement | null = null;
    for (const node of tree.children) {
      if (node.type === 'heading' && (node as Heading).depth === 2) {
        const part = partForHeading(toString(node));
        current = {
          type: 'mdxJsxFlowElement',
          name: 'section',
          attributes: [attr('data-part', part), attr('className', `lesson-part lesson-part--${part}`)],
          children: [node as Heading],
        };
        out.push(current);
      } else if (current) {
        current.children.push(node as MdxJsxFlowElement['children'][number]);
      } else {
        out.push(node);
      }
    }
    tree.children = out;
  };
}
