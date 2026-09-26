// The components a lesson may use (see src/components/mdx.tsx and docs/AUTHORING.md).
export const LESSON_COMPONENTS_LIST = [
  'Callout',
  'Compare',
  'Side',
  'DesignMap',
  'Diagram',
  'GoDeeper',
  'ResponseTimeChart',
  'Term',
  'Quiz',
  'Sort',
  'WriteIt',
  'ScenarioExercise',
  'DiagramExercise',
  'EstimationCalculator',
  'AvailabilityCalculator',
  'ScenarioBuilder',
  'ContractBuilder',
] as const;
export type LessonComponentName = (typeof LESSON_COMPONENTS_LIST)[number];

/** Components that count as a lesson's "Try it" exercise. */
export const EXERCISE_COMPONENTS_LIST: string[] = [
  'Quiz',
  'Sort',
  'WriteIt',
  'ScenarioExercise',
  'DiagramExercise',
  'EstimationCalculator',
  'AvailabilityCalculator',
  'ContractBuilder',
  'ScenarioBuilder',
];
