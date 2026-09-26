import type { MapPart } from './schemas';

/** The eleven parts of a design (Unit 1, lesson 4), with a plain-English line for each. */
export const MAP: { part: MapPart; label: string; blurb: string; question: string }[] = [
  { part: 'requirements', label: 'Requirements', blurb: 'What it must do, and how well.', question: 'What must it do? How fast, how reliable, how cheap?' },
  { part: 'domain-model', label: 'Domain model', blurb: 'The concepts and how they relate.', question: 'What are the things, and how do they relate?' },
  { part: 'boundaries', label: 'Boundaries', blurb: 'Which module owns what.', question: 'Which part owns which things? Who may ask whom?' },
  { part: 'data-model', label: 'Data model', blurb: 'Tables, keys and constraints.', question: 'How is it stored? What keeps the data correct?' },
  { part: 'contracts', label: 'Contracts', blurb: 'Promises between parts.', question: 'What exactly does each part promise the others?' },
  { part: 'flows', label: 'Flows', blurb: 'Who calls whom, step by step.', question: 'What happens, in what order, when something occurs?' },
  { part: 'state', label: 'State', blurb: 'The lives things go through.', question: 'What stages does each thing pass through?' },
  { part: 'failure', label: 'Failure', blurb: 'What goes wrong, and what then.', question: 'What if a step fails, is slow, or runs twice?' },
  { part: 'security', label: 'Security', blurb: 'Who can do what, where.', question: 'Who may do what, and to which things?' },
  { part: 'operations', label: 'Operations', blurb: 'Knowing it is healthy.', question: 'How will we know it works, and notice when it doesn’t?' },
  { part: 'evolution', label: 'Evolution', blurb: 'Changing it safely over time.', question: 'How will it change without breaking the people using it?' },
];
