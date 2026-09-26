// Everything a lesson's MDX can use. See docs/AUTHORING.md for how to use each one.
import { DiagramExercise, Quiz, ScenarioExercise, Sort, WriteIt } from './exercises';
import { Callout } from './lesson/Callout';
import { Compare, Side } from './lesson/Compare';
import { DesignMap } from './lesson/DesignMap';
import { Diagram } from './lesson/Diagram';
import { GoDeeper } from './lesson/GoDeeper';
import { ResponseTimeChart } from './lesson/ResponseTimeChart';
import { Term } from './lesson/Term';
import type { LessonComponentName } from '@/lib/component-names';
import { mdComponents } from './mdComponentsBasic';
import { AvailabilityCalculator } from './tools/AvailabilityCalculator';
import { ContractBuilder } from './tools/ContractBuilder';
import { EstimationCalculator } from './tools/EstimationCalculator';
import { ScenarioBuilder } from './tools/ScenarioBuilder';

export const lessonComponents = {
  ...mdComponents,
  Callout,
  Compare,
  Side,
  DesignMap,
  Diagram,
  GoDeeper,
  ResponseTimeChart,
  Term,
  Quiz,
  Sort,
  WriteIt,
  ScenarioExercise,
  DiagramExercise,
  EstimationCalculator,
  AvailabilityCalculator,
  ScenarioBuilder,
  ContractBuilder,
} satisfies Record<LessonComponentName, unknown> & typeof mdComponents;
