# System Design, in Plain English — App Plan

A small web app that teaches system design step by step, in plain English, using one running example throughout. This file is the plan; the app gets built from it in this repo.

---

## 1. Purpose

Teach someone who can already code how to **design** a system before building it:

- what the parts of a design are, and the order to work through them
- how to write requirements that can be measured (latency, availability, and so on)
- how to design a contract between two parts of a system
- which tools to use (UML, C4, Mermaid, OpenAPI, JSON Schema, Zod, ADRs), and when

By the end, the learner writes a complete one-page design for the running example, using a template the app provides.

## 2. Audience and tone

- **Audience:** developers who are comfortable with code but new to formal design. No prior UML or architecture knowledge assumed.
- **Plain English first.** Every term is introduced in everyday words before its formal name. ("A promise between two parts of a system — this is called a *contract*.")
- **Short lessons.** Each lesson takes 5–10 minutes to read. One idea per lesson.
- **Show, then name, then practise.** Concrete example → the general idea → a small exercise.
- **No jargon without a glossary entry.** Any technical term links to the glossary.
- **Honest about trade-offs.** When there's no single right answer, the lesson says so and shows what each choice costs.

## 3. The running example: "Shelf"

Every lesson uses the same fictional system so the learner builds one design gradually instead of seeing disconnected examples.

**Shelf** is a small labelling service. Other apps (a recipe site, a quiz app, a photo gallery) keep their own items; Shelf lets people put tags on those items and look items up by tag.

Why this example:
- small enough to hold in your head
- has two real sides that need a contract (Shelf and the apps that plug into it)
- has interesting questions: who owns an item, what happens when one is deleted, who may tag what
- naturally needs every part of the design process

Key facts about Shelf, reused throughout:
- Apps register as **sources**. Each source owns its **items**; Shelf only stores **tags** and a cached title.
- Tags live in **scopes** (a tree). A tag defined in a scope can only go on items in that scope or below it.
- Apps can **push** changes to Shelf, and Shelf also **pulls** a full list on a schedule as a safety net.
- A missing item keeps its tags for 30 days in case it comes back.

## 4. Curriculum

Eleven units plus a capstone. Each lesson lists what it teaches, then the exercise that ends it.

### Unit 1 — Getting oriented
1. **What "designing a system" means.** Deciding the parts, how they talk, and what they promise, before writing code. Why it saves time.
   - *Exercise:* sort ten decisions into "cheap to change later" vs "expensive to change later".
2. **Design vs architecture.** Architecture = the big, expensive-to-change decisions. Design = architecture plus the detail inside each part. The rewrite test: "if getting it wrong means a migration, it's architecture."
   - *Exercise:* label each Shelf decision as architecture or design.
3. **Meet Shelf.** The running example, its users, and the apps that plug in.
4. **The map.** The eleven parts of a design, in order: requirements → domain model → boundaries → data model → contracts → flows → state → failure → security → operations → evolution. This diagram is shown at the top of every later unit, with the current part highlighted.

### Unit 2 — Requirements
1. **What the system must do (functional requirements).** User stories and acceptance criteria.
   - *Exercise:* rewrite three vague wishes as stories with acceptance criteria.
2. **How well it must do it (non-functional requirements).** The quality attributes: latency, throughput, availability, durability, recovery, freshness, scalability, security, maintainability, operability, cost. One plain-English sentence and one measurable example each.
3. **Making a requirement measurable.** "Fast" is a wish; "95% of requests finish within 200 ms at 20 requests per second" is a requirement. Percentiles vs averages, explained with a simple picture of response times.
   - *Exercise:* "Is this measurable?" — 12 statements; the learner judges each and sees the reason.
4. **Estimating on the back of an envelope.** Users → requests per day → requests per second → peak; items × size → storage.
   - *Interactive:* estimation calculator (see §6).
5. **Availability in real time.** What 99%, 99.9% and 99.99% mean as minutes of downtime per month.
   - *Interactive:* availability calculator.
6. **Quality scenarios.** The five-part form: source, stimulus, environment, response, measure.
   - *Exercise:* fill in a scenario for "an app pushes 500 changed items".
7. **Constraints and priorities.** Constraints are fixed facts (one server, one developer), not goals. Ranking requirements and deciding in advance which wins when two conflict.

### Unit 3 — The domain model
1. **Finding the nouns.** Pull the concepts out of the requirements: source, item, scope, tag.
2. **Relationships.** One-to-many, many-to-many, belongs-to, in plain words first, then as a class diagram.
3. **Identity.** What makes an item *that* item: stable keys, and what happens when keys change.
4. **Who owns the truth.** Source of truth vs cached copy. Shelf owns tags; sources own items.
   - *Exercise:* for eight pieces of data, choose the owner.

### Unit 4 — Boundaries and modules
1. **Drawing the lines.** Group concepts into modules. Each module owns its data; others ask it.
2. **Which way dependencies point.** Why Shelf should know nothing about recipes or quizzes.
3. **Plug-in points.** Letting other parts add to a module (a registry of source kinds) without the module knowing them.
   - *Exercise:* spot the boundary violation in three small designs.

### Unit 5 — The data model
1. **From concepts to tables.** Turning the domain model into tables, keys and constraints (shown as an ER diagram).
2. **Cached vs owned columns.** Keeping a copy of the title, and how to keep it fresh.
3. **Soft deletes and retention.** Present / missing / trashed, and the 30-day rule.

### Unit 6 — Contracts (the longest unit)
1. **What a contract is.** A promise between a provider and a consumer. Examples everywhere: HTTP APIs, config files, events, shared types.
2. **Step 1: sides and ownership.** Decide who owns what before anything else. Most bad contracts are unclear about this.
3. **Step 2: nouns and identity.** Resources, keys, limits (e.g. "id: text, at most 200 characters").
4. **Step 3: operations.** For each: inputs, outputs, preconditions, postconditions.
5. **Step 4: errors are part of the contract.** Every way it can fail and what the caller sees.
   - *Exercise:* "Spot the missing error" — find what three contracts forgot to say.
6. **Step 5: behavioural guarantees.** Idempotency (safe to send twice?), ordering, freshness, pagination, limits, timeouts. One tiny story for each showing what goes wrong without it.
7. **Step 6: who may call it.** Keys, privileges, scopes.
8. **Step 7: changing a contract safely.** Add freely; never remove or repurpose; version when you must.
9. **Step 8: write it down so a machine can check it.** The same Shelf endpoint written three ways: OpenAPI, JSON Schema, and a Zod schema. What each is best at.
   - *Interactive:* contract builder (see §6).
10. **Worked example.** Shelf's list endpoint, start to finish, including the "an item missing from a full listing counts as missing" decision and why it matters.

### Unit 7 — Flows and state
1. **Sequence diagrams.** "An app pushes a change" drawn step by step.
2. **State diagrams.** An item's life: present → missing → trashed → gone.
   - *Exercise:* draw the state diagram for a tag being renamed (in the diagram playground).

### Unit 8 — When things go wrong
1. **Listing failure modes.** For each step in a flow: what if it fails, is slow, or runs twice?
2. **Responses to failure.** Retry, roll back, degrade, alert, with a Shelf example for each.
3. **Knowing it's healthy.** Health checks, logs, metrics, and SLIs vs SLOs in plain words.

### Unit 9 — Security and permissions
1. **Who can do what, where.** Roles, privileges and scopes, using Shelf's "a key only sees its own scope".
2. **Designing for least access.** Default deny, and giving each app only what it needs.

### Unit 10 — Changing the system over time
1. **Migrations without breaking users.** Moving from an old model to a new one while existing users see no difference.
2. **Recording decisions (ADRs).** Context, options, choice, consequences. Why future-you needs them.
   - *Exercise:* write an ADR for "push, pull, or both?"

### Unit 11 — The toolbox
1. **UML, only the useful parts.** Class, sequence, state, component and activity diagrams, with when to use each.
   - *Exercise:* "Pick the diagram" — eight situations, choose the best diagram.
2. **C4: zooming in and out.** Context → containers → components → code, shown for Shelf.
3. **Diagrams as code.** Mermaid, PlantUML, Structurizr, D2, DBML: text you commit and diff.
4. **Contract tools.** OpenAPI, JSON Schema, AsyncAPI, Zod, Protobuf. A table of which to reach for.
5. **Keeping contracts honest.** Contract tests: checking that real responses match the written contract.

### Capstone — Design Shelf on one page
A guided form that walks through every part and produces a one-page design document (markdown) the learner can copy or download:
requirements (stories + quality scenarios + constraints) → domain model (Mermaid) → modules → data model → one contract → one sequence diagram → one state diagram → failure modes → permissions → one ADR.

A finished reference design is available to compare against after the learner submits.

## 5. Lesson format

Every lesson follows the same shape:

1. **In one sentence.** The idea, in plain English.
2. **Example.** Shown with Shelf.
3. **The general idea.** Now named, with the formal term.
4. **Common mistakes.** Two or three, briefly.
5. **Try it.** A small exercise with immediate feedback.
6. **Key terms.** Linked to the glossary.

## 6. Interactive pieces

All run in the browser, with no server and no AI. Feedback is written by hand into the lesson content.

| Piece | What it does |
|---|---|
| **Quiz** | Multiple choice with an explanation for every option, including the wrong ones. |
| **Sort / classify** | Drag or tap items into buckets (architecture vs design, measurable vs not). Shows the reason for each. |
| **Estimation calculator** | Inputs: users, actions per user per day, peak factor, item size, item count. Outputs: average and peak requests/s, storage. Shows each step of the arithmetic in words. |
| **Availability calculator** | Percentage → downtime per day, month, year. And the reverse. |
| **Quality-scenario builder** | Five fields with hints; flags a missing or unmeasurable "measure". |
| **Contract builder** | Form for one endpoint (inputs, outputs, errors, guarantees, auth). Generates matching OpenAPI YAML, JSON Schema and Zod code side by side. Warns when errors or guarantees are left blank. |
| **Diagram playground** | Mermaid editor with live preview and starter templates (class, sequence, state, C4-style). |
| **Design-doc template** | The capstone form; exports markdown. |

## 7. App features

- Home page with the map (Unit 1.4) as navigation.
- Sidebar with units and lessons, and a progress tick for each completed lesson.
- Previous / next lesson buttons.
- Glossary page; hovering a linked term shows a short definition.
- Search across lessons and the glossary.
- Progress, exercise answers and capstone drafts saved in the browser (localStorage). No accounts.
- Light and dark mode.
- Works on a phone.
- Accessible: keyboard navigable, proper headings, alt text, sufficient contrast, diagrams with a text description underneath.

## 8. Suggested tech stack

- **Next.js** (App Router) + **TypeScript**, exported as a static site.
- **MDX** for lessons, one file per lesson, with frontmatter (`unit`, `order`, `title`, `summary`, `minutes`, `terms`).
- **Mermaid** for all diagrams (lesson diagrams are written as text in the MDX).
- **Zod** for exercise data and for the contract builder's generated output.
- **Tailwind CSS** for styling.
- **Vitest** for unit tests (calculators, generators, content validation); **Playwright** for a few end-to-end paths.

## 9. Repo structure

```
/content
  /lessons/<unit>-<slug>/<order>-<slug>.mdx
  glossary.yaml
  /exercises/*.yaml          ← quiz and sort data, validated by Zod
  /reference/shelf-design.md ← capstone reference design
/src
  /app                       ← routes: /, /learn/[unit]/[lesson], /glossary, /playground, /capstone
  /components                ← Callout, Diagram, Quiz, Sort, Term, TryIt, calculators, builders
  /lib                       ← content loading, progress storage, generators
/tests
PLAN.md
README.md
```

## 10. Build milestones

Each milestone ends with something working that can be reviewed.

1. **Skeleton.** Next.js app, lesson loading from MDX, sidebar, previous/next, glossary page, light/dark mode. Two sample lessons. Content validation test (every lesson has valid frontmatter; every linked term exists in the glossary).
2. **Core components.** Callout, Diagram (Mermaid with text description), Term tooltip, Quiz, Sort. Progress saved in the browser.
3. **Units 1–2 written in full**, with the estimation and availability calculators and the quality-scenario builder.
4. **Units 3–5** written in full.
5. **Unit 6 (contracts)** written in full, with the contract builder and tests for its generated OpenAPI, JSON Schema and Zod output.
6. **Units 7–11** written in full, with the diagram playground.
7. **Capstone** form, markdown export, and reference design.
8. **Polish.** Search, mobile layout, accessibility pass, Playwright tests for: reading a lesson, finishing a quiz, using the contract builder, exporting the capstone.

### Definition of done for each lesson
- follows the lesson format in §5
- uses Shelf as its example
- has at least one exercise with feedback
- every technical term is in the glossary
- every diagram has a text description
- readable in 10 minutes or less

## 11. Out of scope for the first version

- accounts, syncing progress between devices
- AI-generated feedback
- a backend or database
- translations

## 12. Open questions

1. **Stack:** is Next.js + MDX right, or would you prefer something lighter (e.g. Astro)?
2. **Hosting:** static files on your VPS behind nginx, or somewhere else?
3. **Running example:** keep the fictional Shelf, or use a real system of yours?
4. **Depth:** plain English only, or an optional "go deeper" box in each lesson for more technical detail?
5. **Content authoring:** should Claude Code write all the lesson text, or build the app with placeholder lessons for you to write?

### Defaults taken for the first version

These can all be changed; none is hard to undo.

1. **Stack:** Next.js + MDX as suggested, exported as a static site (`out/`).
2. **Hosting:** host-agnostic static files. Works behind nginx on a VPS (see the README) and on GitHub Pages (`BASE_PATH` for a sub-folder).
3. **Running example:** the fictional Shelf. Its full design is `content/reference/shelf-design.md`.
4. **Depth:** plain English, with an optional, closed-by-default "Go deeper" box used sparingly (at most one per lesson).
5. **Content authoring:** all lesson text written in full, following `docs/AUTHORING.md`.
