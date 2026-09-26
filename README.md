# System Design, in Plain English

A small web app that teaches system design step by step, in plain English, using one running example throughout: **Shelf**, a labelling service that other apps plug into. By the end, the learner writes a complete one-page design for Shelf.

The plan the app was built from is [PLAN.md](PLAN.md). How lessons are written is [docs/AUTHORING.md](docs/AUTHORING.md).

## What's in it

- **Eleven units, 45 short lessons** (5–10 minutes each), from “what designing a system means” to contract tests. Every lesson has the same shape: *In one sentence → Example (always Shelf) → The general idea → Common mistakes → Try it → Key terms*.
- **The map.** The eleven parts of a design (requirements → domain model → boundaries → data model → contracts → flows → state → failure → security → operations → evolution). It is the home page’s navigation, and a strip at the top of every lesson from Unit 2 on shows where you are.
- **Exercises with feedback written by hand** (no AI, no server): quizzes with an explanation for every option, sorting into buckets with a reason for every item, free writing compared against a model answer and a checklist, a quality-scenario builder, and “draw it” diagram exercises.
- **Tools** (also on `/tools`):
  - estimation calculator (users → requests/day → requests/s → peak; items × size → storage), with every step in words;
  - availability calculator (percentage ↔ downtime per day/week/month/year, and parts in series);
  - quality-scenario builder (flags a missing or unmeasurable measure);
  - contract builder: one endpoint’s sides, inputs, output, errors, guarantees and auth → **OpenAPI 3.1, JSON Schema and Zod** side by side, with warnings for anything left unsaid;
  - diagram playground: a Mermaid editor with live preview and Shelf-based templates (class, sequence, state, ER, C4-style, activity).
- **Capstone** (`/capstone`): a guided form through every part of the design that exports one markdown document. After submitting, a finished reference design appears for comparison, part by part.
- **Glossary** of every term, with hover (or tap) definitions wherever a term appears in a lesson.
- **Search** across lessons and the glossary (press `/` or `Ctrl K`).
- Progress ticks, exercise answers and capstone drafts are saved in the browser (localStorage). No accounts, nothing sent anywhere.
- Light and dark themes, phone layout, keyboard navigation, text descriptions under every diagram.

## Running it

Needs Node 20 or later.

```bash
npm install
npm run dev          # http://localhost:3000, reloads as you edit lessons
npm run build        # static site in out/
npm start            # serve out/ on http://localhost:3000
```

## Tests

```bash
npm run typecheck
npm test                       # unit tests (calculators, contract generators, capstone export, search) and content validation
npm run check:diagrams         # renders every Mermaid diagram in the course with the real Mermaid (headless Chromium)
npm run build && npm run test:e2e   # Playwright: reading a lesson, finishing a quiz, the contract builder, exporting the capstone,
                                    # every lesson renders, search, the phone layout, and an axe accessibility scan
```

The content tests (`tests/content.test.ts`) enforce the plan’s definition of done for every lesson: the lesson format, glossary links that exist, a text description for every diagram, at least one exercise, valid links, and a length readable in ten minutes. `UNIT=3 npx vitest run tests/content.test.ts` checks one unit.

The contract generators are tested against real validators: the OpenAPI output with `@apidevtools/swagger-parser`, the JSON Schema with Ajv, and the Zod code by running it with `zod`.

CI (`.github/workflows/ci.yml`) runs all of the above on every push.

## Deploying

The build is plain static files in `out/`, so any web server will do.

**On a VPS behind nginx:**

```nginx
server {
    listen 80;
    server_name design.example.com;
    root /var/www/system-design-prep/out;

    location / {
        try_files $uri $uri/ =404;
    }
    location /_next/static/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    error_page 404 /404.html;
}
```

Build on the server (or in CI) and copy `out/` to the `root` folder.

**In a sub-folder** (for example GitHub Pages at `https://<user>.github.io/system-design-prep/`), set `BASE_PATH` when building: `BASE_PATH=/system-design-prep npm run build`. The workflow `.github/workflows/deploy-pages.yml` does this; it runs only when started by hand (Settings → Pages → Source: GitHub Actions first).

## Project layout

```
content/
  units.yaml                    the units and their planned lessons, in order
  lessons/<nn>-<unit>/<nn>-<slug>.mdx
  exercises/<id>.yaml           quiz, sort, write, scenario and diagram exercises (validated with Zod)
  glossary.yaml
  reference/shelf-design.md     the capstone's reference design, and the source of truth for Shelf
src/
  app/                          routes: /, /learn/[unit], /learn/[unit]/[lesson], /glossary, /tools, /playground, /capstone, /search-index.json
  components/                   lesson components (Callout, Diagram, Term…), exercises, tools, capstone, layout
  lib/                          content loading, MDX, storage and progress, calculators, contract generators, capstone export, search
scripts/                        diagram checker, static server, YAML fixer
tests/                          Vitest unit and content tests; tests/e2e for Playwright
docs/AUTHORING.md               how to write a lesson
```

## Writing or changing lessons

Read [docs/AUTHORING.md](docs/AUTHORING.md). In short: one MDX file per lesson with frontmatter, the five `##` sections, Shelf in every example, glossary terms linked with `<Term id="…">`, Mermaid diagrams inside `<Diagram description="…">`, and exercises in `content/exercises/*.yaml`. Then run the content tests and the diagram checker.

## Choices made for the first version

The plan left five questions open. The defaults taken (all easy to change) are listed at the end of [PLAN.md](PLAN.md#12-open-questions): Next.js + MDX as a static export; host-agnostic static files; the fictional Shelf; plain English with an optional “Go deeper” box; all lesson text written in full.
