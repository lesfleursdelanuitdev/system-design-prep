// Zod schemas for everything under /content. The content loader and the content
// tests both use these, so a lesson that loads is a lesson that passes validation.
import { z } from 'zod';

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lower-case words joined by hyphens');

/** The eleven parts of a design, in the order the course works through them. */
export const MAP_PARTS = [
  'requirements',
  'domain-model',
  'boundaries',
  'data-model',
  'contracts',
  'flows',
  'state',
  'failure',
  'security',
  'operations',
  'evolution',
] as const;
export type MapPart = (typeof MAP_PARTS)[number];

export const unitSchema = z
  .object({
    number: z.number().int().positive(),
    slug,
    title: z.string().min(3),
    summary: z.string().min(10),
    /** The map part every lesson in this unit highlights, unless a lesson says otherwise. */
    mapPart: z.enum(MAP_PARTS).optional(),
    /** The planned lessons, in order. Lesson files must match: <nn>-<slug>.mdx with nn = position. */
    lessons: z.array(slug).min(1),
  })
  .strict();
export type Unit = z.infer<typeof unitSchema>;

export const unitsFileSchema = z.array(unitSchema).min(1);

export const frontmatterSchema = z
  .object({
    unit: z.number().int().positive(),
    order: z.number().int().positive(),
    title: z.string().min(3),
    summary: z.string().min(10).max(240),
    minutes: z.number().int().min(3).max(10),
    terms: z.array(slug).default([]),
    mapPart: z.enum(MAP_PARTS).optional(),
  })
  .strict();
export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const glossaryEntrySchema = z
  .object({
    id: slug,
    term: z.string().min(1),
    /** One or two plain-English sentences. Shown in the hover tooltip. */
    short: z.string().min(10).max(260),
    /** Optional longer explanation (markdown) shown on the glossary page. */
    long: z.string().optional(),
    aka: z.array(z.string()).optional(),
    see: z.array(slug).optional(),
  })
  .strict();
export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;
export const glossaryFileSchema = z.array(glossaryEntrySchema);

// ---- Exercises ----------------------------------------------------------------

const quizOption = z
  .object({
    text: z.string().min(1),
    correct: z.boolean().optional(),
    explanation: z.string().min(1),
  })
  .strict();

const quizQuestion = z
  .object({
    prompt: z.string().min(1),
    options: z.array(quizOption).min(2).max(6),
  })
  .strict()
  .refine((q) => q.options.filter((o) => o.correct).length === 1, {
    message: 'each question needs exactly one option marked correct: true',
  });

const base = {
  id: slug,
  title: z.string().optional(),
  intro: z.string().optional(),
};

export const quizExerciseSchema = z
  .object({ ...base, type: z.literal('quiz'), questions: z.array(quizQuestion).min(1) })
  .strict();

export const sortExerciseSchema = z
  .object({
    ...base,
    type: z.literal('sort'),
    buckets: z
      .array(z.object({ id: slug, label: z.string().min(1), hint: z.string().optional() }).strict())
      .min(2)
      .max(4),
    items: z
      .array(z.object({ text: z.string().min(1), bucket: slug, reason: z.string().min(1) }).strict())
      .min(2),
  })
  .strict()
  .refine((s) => s.items.every((i) => s.buckets.some((b) => b.id === i.bucket)), {
    message: 'every item.bucket must be one of the bucket ids',
  });

export const writeExerciseSchema = z
  .object({
    ...base,
    type: z.literal('write'),
    prompt: z.string().min(1),
    starter: z.string().optional(),
    hints: z.array(z.string()).default([]),
    checklist: z.array(z.string()).default([]),
    modelAnswer: z.string().min(1),
    rows: z.number().int().min(3).max(40).optional(),
  })
  .strict();

const scenarioParts = z
  .object({
    source: z.string().min(1),
    stimulus: z.string().min(1),
    environment: z.string().min(1),
    response: z.string().min(1),
    measure: z.string().min(1),
  })
  .strict();

export const scenarioExerciseSchema = z
  .object({
    ...base,
    type: z.literal('scenario'),
    prompt: z.string().min(1),
    starter: scenarioParts.partial().optional(),
    modelAnswer: scenarioParts,
    notes: z.string().optional(),
  })
  .strict();

export const diagramExerciseSchema = z
  .object({
    ...base,
    type: z.literal('diagram'),
    prompt: z.string().min(1),
    starter: z.string().min(1),
    hints: z.array(z.string()).default([]),
    modelAnswer: z.string().min(1),
    modelDescription: z.string().min(10),
    checklist: z.array(z.string()).default([]),
  })
  .strict();

export const exerciseSchema = z.discriminatedUnion('type', [
  quizExerciseSchema,
  sortExerciseSchema,
  writeExerciseSchema,
  scenarioExerciseSchema,
  diagramExerciseSchema,
]);
export type Exercise = z.infer<typeof exerciseSchema>;
export type QuizExercise = z.infer<typeof quizExerciseSchema>;
export type SortExercise = z.infer<typeof sortExerciseSchema>;
export type WriteExercise = z.infer<typeof writeExerciseSchema>;
export type ScenarioExercise = z.infer<typeof scenarioExerciseSchema>;
export type DiagramExercise = z.infer<typeof diagramExerciseSchema>;
export type ScenarioParts = z.infer<typeof scenarioParts>;
