// Checks for the quality-scenario builder (Unit 2, lesson 6).
import type { ScenarioParts } from './schemas';

export const SCENARIO_FIELDS: { key: keyof ScenarioParts; label: string; question: string; example: string }[] = [
  { key: 'source', label: 'Source', question: 'Who or what starts it?', example: 'The recipe site' },
  { key: 'stimulus', label: 'Stimulus', question: 'What do they do, or what happens?', example: 'asks for the items tagged “vegetarian”' },
  { key: 'environment', label: 'Environment', question: 'Under what conditions?', example: 'during normal daytime traffic of 20 requests per second' },
  { key: 'response', label: 'Response', question: 'What should the system do?', example: 'Shelf returns the first page of matching items' },
  { key: 'measure', label: 'Measure', question: 'How will we check it happened well enough? (a number)', example: 'within 200 ms for 95% of requests' },
];

export type Issue = { field: keyof ScenarioParts; level: 'error' | 'warn' | 'tip'; message: string };

const VAGUE = [
  'fast',
  'faster',
  'quick',
  'quickly',
  'soon',
  'promptly',
  'reliable',
  'reliably',
  'robust',
  'scalable',
  'efficient',
  'efficiently',
  'responsive',
  'seamless',
  'seamlessly',
  'easily',
  'easy',
  'user-friendly',
  'acceptable',
  'reasonable',
  'reasonably',
  'good',
  'properly',
  'smoothly',
  'instantly',
  'immediately',
  'gracefully',
  'minimal',
  'lots',
];

const UNIT = /(\d)\s*(%|ms\b|milliseconds?|s\b|secs?\b|seconds?|mins?\b|minutes?|h\b|hrs?\b|hours?|days?|weeks?|months?|requests?|rps\b|items?|changes?|errors?|times?|per\b|kb\b|mb\b|gb\b|tb\b|users?|people|steps?|clicks?|retries|attempts?|x\b|×|\$|£|€)/i;
const TIME = /\b(\d+(\.\d+)?)\s*(ms|milliseconds?|s|secs?|seconds?|mins?|minutes?|hours?|h)\b/i;
const SHARE = /(%|percent|\bp\d{2}\b|\ball\b|\bevery\b|\beach\b|\bmedian\b|\bnone\b|\bno more than\b|\bat least\b|\bmaximum\b|\bat most\b|\bnever\b)/i;

export function vagueWords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z][a-z-]*/g) ?? [];
  return [...new Set(words.filter((w) => VAGUE.includes(w)))];
}

export function checkScenario(parts: Partial<ScenarioParts>): Issue[] {
  const issues: Issue[] = [];
  for (const f of SCENARIO_FIELDS) {
    if (!(parts[f.key] ?? '').trim()) issues.push({ field: f.key, level: 'error', message: `Fill in the ${f.label.toLowerCase()}: ${f.question.toLowerCase()}` });
  }
  const measure = (parts.measure ?? '').trim();
  if (measure) {
    if (!/\d/.test(measure)) {
      issues.push({ field: 'measure', level: 'error', message: 'The measure has no number in it, so nobody can check it. Add one: a time, a percentage or a count.' });
    } else if (!UNIT.test(measure)) {
      issues.push({ field: 'measure', level: 'warn', message: 'Say what the number counts: milliseconds, seconds, %, requests, items…' });
    }
    for (const w of vagueWords(measure)) {
      issues.push({ field: 'measure', level: 'warn', message: `“${w}” is a wish, not a measure. Replace it with a number.` });
    }
    if (TIME.test(measure) && !SHARE.test(measure)) {
      issues.push({ field: 'measure', level: 'tip', message: 'Say for what share of cases, e.g. “for 95% of requests”. Averages hide the slow ones.' });
    }
  }
  const env = (parts.environment ?? '').trim();
  if (env && /^(always|any ?time|normally|normal)$/i.test(env)) {
    issues.push({ field: 'environment', level: 'tip', message: 'Be specific about the conditions: how busy is it? Is anything broken?' });
  }
  return issues;
}

/** “When the recipe site asks for… during…, Shelf…, within…” */
export function scenarioSentence(p: Partial<ScenarioParts>): string {
  const t = (s?: string) => (s ?? '').trim().replace(/[.\s]+$/, '');
  const parts = [
    t(p.source) || '[source]',
    t(p.stimulus) || '[stimulus]',
    t(p.environment) ? `(${t(p.environment)})` : '[environment]',
  ];
  const lead = `When ${lowerFirst(parts[0])} ${parts[1]} ${parts[2]}`;
  return `${lead}, ${lowerFirst(t(p.response) || '[response]')}, ${lowerFirst(t(p.measure) || '[measure]')}.`;
}

function lowerFirst(s: string): string {
  // Keep capitals that start a proper noun like "Shelf" or an acronym like "API".
  if (/^(Shelf|API|[A-Z]{2,})\b/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function scenarioMarkdown(p: Partial<ScenarioParts>, title = 'Quality scenario'): string {
  const esc = (s?: string) => (s ?? '').trim().replace(/\|/g, '\\|').replace(/\n+/g, ' ') || '—';
  return [
    `**${title}**`,
    '',
    '| Part | Scenario |',
    '|---|---|',
    ...SCENARIO_FIELDS.map((f) => `| ${f.label} | ${esc(p[f.key])} |`),
  ].join('\n');
}
