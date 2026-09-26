// Loads the course from /content at build time (server only).
//   content/units.yaml                          the units, in order
//   content/lessons/<nn>-<unit>/<nn>-<slug>.mdx  one file per lesson
//   content/glossary.yaml                       every term a lesson may link to
//   content/exercises/<id>.yaml                 quiz, sort and writing exercises
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  exerciseSchema,
  frontmatterSchema,
  glossaryFileSchema,
  unitsFileSchema,
  type Exercise,
  type Frontmatter,
  type GlossaryEntry,
  type MapPart,
  type Unit,
} from './schemas';

export const CONTENT_DIR = path.join(process.cwd(), 'content');
const LESSONS_DIR = path.join(CONTENT_DIR, 'lessons');
const EXERCISES_DIR = path.join(CONTENT_DIR, 'exercises');

export type Lesson = Omit<Frontmatter, 'mapPart'> & {
  /** `<unit slug>/<lesson slug>`: stable id used for progress. */
  id: string;
  slug: string;
  unitSlug: string;
  unitTitle: string;
  mapPart?: MapPart;
  href: string;
  /** Path relative to the repo, for error messages. */
  file: string;
  /** The MDX body without its frontmatter. */
  body: string;
};

const cacheOn = process.env.NODE_ENV === 'production' || process.env.VITEST === 'true';
const cache = new Map<string, unknown>();
function cached<T>(key: string, load: () => T): T {
  if (cacheOn && cache.has(key)) return cache.get(key) as T;
  const value = load();
  if (cacheOn) cache.set(key, value);
  return value;
}

function readYaml(file: string): unknown {
  try {
    return parseYaml(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${path.relative(process.cwd(), file)}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function describeZodError(file: string, error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const lines = error.issues.map((i) => `  ${i.path.map(String).join('.') || '(root)'}: ${i.message}`);
  return `${path.relative(process.cwd(), file)} is invalid:\n${lines.join('\n')}`;
}

/** Splits `---\nyaml\n---\nbody` into its two parts. */
export function splitFrontmatter(raw: string): { data: unknown; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  return { data: parseYaml(match[1]), body: raw.slice(match[0].length) };
}

export function getUnits(): Unit[] {
  return cached('units', () => {
    const file = path.join(CONTENT_DIR, 'units.yaml');
    const parsed = unitsFileSchema.safeParse(readYaml(file));
    if (!parsed.success) throw new Error(describeZodError(file, parsed.error));
    return parsed.data;
  });
}

export function getUnit(slug: string): Unit | undefined {
  return getUnits().find((u) => u.slug === slug);
}

const numbered = /^(\d+)-([a-z0-9-]+)$/;

export function getLessons(): Lesson[] {
  return cached('lessons', () => {
    const units = getUnits();
    const lessons: Lesson[] = [];
    if (!fs.existsSync(LESSONS_DIR)) return lessons;
    for (const dir of fs.readdirSync(LESSONS_DIR).sort()) {
      const full = path.join(LESSONS_DIR, dir);
      if (!fs.statSync(full).isDirectory()) continue;
      const dm = numbered.exec(dir);
      if (!dm) throw new Error(`content/lessons/${dir}: folder names look like 02-requirements`);
      const unit = units.find((u) => u.number === Number(dm[1]));
      if (!unit || unit.slug !== dm[2]) {
        throw new Error(`content/lessons/${dir}: no unit ${Number(dm[1])} with slug "${dm[2]}" in units.yaml`);
      }
      for (const name of fs.readdirSync(full).sort()) {
        if (!name.endsWith('.mdx')) continue;
        const file = path.join(full, name);
        const fm = numbered.exec(name.replace(/\.mdx$/, ''));
        if (!fm) throw new Error(`${path.relative(process.cwd(), file)}: file names look like 03-making-it-measurable.mdx`);
        const { data, body } = splitFrontmatter(fs.readFileSync(file, 'utf8'));
        const parsed = frontmatterSchema.safeParse(data);
        if (!parsed.success) throw new Error(describeZodError(file, parsed.error));
        const meta = parsed.data;
        if (meta.unit !== unit.number) throw new Error(`${name}: frontmatter says unit ${meta.unit} but it is in ${dir}`);
        if (meta.order !== Number(fm[1])) throw new Error(`${name}: frontmatter says order ${meta.order} but the file name starts ${fm[1]}`);
        if (unit.lessons[meta.order - 1] !== fm[2]) {
          throw new Error(`${name}: units.yaml plans lesson ${meta.order} of unit ${unit.number} as "${unit.lessons[meta.order - 1] ?? '(none)'}"`);
        }
        lessons.push({
          ...meta,
          id: `${unit.slug}/${fm[2]}`,
          slug: fm[2],
          unitSlug: unit.slug,
          unitTitle: unit.title,
          mapPart: meta.mapPart ?? unit.mapPart,
          href: `/learn/${unit.slug}/${fm[2]}/`,
          file: path.relative(process.cwd(), file),
          body,
        });
      }
    }
    lessons.sort((a, b) => a.unit - b.unit || a.order - b.order);
    return lessons;
  });
}

export function getLesson(unitSlug: string, lessonSlug: string): Lesson | undefined {
  return getLessons().find((l) => l.unitSlug === unitSlug && l.slug === lessonSlug);
}

export function getUnitLessons(unitSlug: string): Lesson[] {
  return getLessons().filter((l) => l.unitSlug === unitSlug);
}

export function getNeighbours(lesson: Lesson): { prev?: Lesson; next?: Lesson } {
  const all = getLessons();
  const i = all.findIndex((l) => l.id === lesson.id);
  return { prev: all[i - 1], next: all[i + 1] };
}

/** Lightweight outline of the course, safe to pass to client components. */
export type OutlineLesson = Pick<Lesson, 'id' | 'title' | 'href' | 'minutes' | 'order'>;
export type OutlineUnit = Pick<Unit, 'number' | 'slug' | 'title'> & { href: string; lessons: OutlineLesson[] };

export function getOutline(): OutlineUnit[] {
  const lessons = getLessons();
  return getUnits()
    .map((u) => ({
      number: u.number,
      slug: u.slug,
      title: u.title,
      href: `/learn/${u.slug}/`,
      lessons: lessons
        .filter((l) => l.unit === u.number)
        .map(({ id, title, href, minutes, order }) => ({ id, title, href, minutes, order })),
    }))
    .filter((u) => u.lessons.length > 0);
}

/** The first lesson that covers each part of the map. */
export function getMapLinks(): Partial<Record<MapPart, string>> {
  const links: Partial<Record<MapPart, string>> = {};
  for (const l of getLessons()) if (l.mapPart && !links[l.mapPart]) links[l.mapPart] = l.href;
  return links;
}

// ---- Glossary -------------------------------------------------------------------

/** Glossary drafts (content/glossary-drafts/*.yaml) are merged in while units are being written. */
export function getGlossary(): GlossaryEntry[] {
  return cached('glossary', () => {
    const files = [path.join(CONTENT_DIR, 'glossary.yaml')];
    const drafts = path.join(CONTENT_DIR, 'glossary-drafts');
    if (fs.existsSync(drafts)) {
      for (const f of fs.readdirSync(drafts).sort()) if (f.endsWith('.yaml')) files.push(path.join(drafts, f));
    }
    const entries: GlossaryEntry[] = [];
    for (const file of files) {
      const parsed = glossaryFileSchema.safeParse(readYaml(file) ?? []);
      if (!parsed.success) throw new Error(describeZodError(file, parsed.error));
      entries.push(...parsed.data);
    }
    return entries.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
  });
}

export function getGlossaryMap(): Map<string, GlossaryEntry> {
  return cached('glossaryMap', () => new Map(getGlossary().map((e) => [e.id, e])));
}

// ---- Exercises ------------------------------------------------------------------

export function getExercises(): Map<string, Exercise> {
  return cached('exercises', () => {
    const map = new Map<string, Exercise>();
    if (!fs.existsSync(EXERCISES_DIR)) return map;
    for (const name of fs.readdirSync(EXERCISES_DIR).sort()) {
      if (!name.endsWith('.yaml')) continue;
      const file = path.join(EXERCISES_DIR, name);
      const parsed = exerciseSchema.safeParse(readYaml(file));
      if (!parsed.success) throw new Error(describeZodError(file, parsed.error));
      if (`${parsed.data.id}.yaml` !== name) throw new Error(`${name}: id "${parsed.data.id}" must match the file name`);
      map.set(parsed.data.id, parsed.data);
    }
    return map;
  });
}

export function getExercise(id: string): Exercise {
  const ex = getExercises().get(id);
  if (!ex) throw new Error(`No exercise with id "${id}" in content/exercises`);
  return ex;
}

export function readReference(name: string): string {
  return fs.readFileSync(path.join(CONTENT_DIR, 'reference', name), 'utf8');
}
