// Starter diagrams for the playground. All use Shelf, the course's running example.
export const TEMPLATES: { id: string; label: string; when: string; code: string }[] = [
  {
    id: 'class',
    label: 'Class diagram',
    when: 'The things in a system and how they relate (the domain model).',
    code: `classDiagram
  direction LR
  class Source {
    id
    name
    homeScope
  }
  class Item {
    itemId
    title
    status
  }
  class Scope {
    path
  }
  class Tag {
    id
    name
  }
  Source "1" --> "*" Item : owns
  Scope "1" --> "*" Scope : contains
  Scope "1" --> "*" Tag : defines
  Item "*" --> "1" Scope : lives in
  Tag "*" -- "*" Item : is put on`,
  },
  {
    id: 'sequence',
    label: 'Sequence diagram',
    when: 'Who talks to whom, in what order, for one flow.',
    code: `sequenceDiagram
  autonumber
  participant App as Recipe site
  participant API as Shelf API
  participant DB as Database
  App->>API: POST /v1/sources/recipes/changes
  API->>API: check the key and the batch
  API->>DB: apply the changes in one transaction
  DB-->>API: done
  API-->>App: 200 with one result per change`,
  },
  {
    id: 'state',
    label: 'State diagram',
    when: 'The stages one thing passes through, and what moves it on.',
    code: `stateDiagram-v2
  [*] --> Present : first seen
  Present --> Missing : deleted, or absent from a full listing
  Missing --> Present : seen again (tags kept)
  Missing --> Trashed : 30 days pass
  Trashed --> Present : seen again (without tags)
  Trashed --> [*] : 7 more days pass (gone)`,
  },
  {
    id: 'er',
    label: 'ER diagram',
    when: 'Tables, their keys and how rows point at each other.',
    code: `erDiagram
  SOURCE ||--o{ ITEM : owns
  ITEM ||--o{ TAGGING : has
  TAG ||--o{ TAGGING : "is used in"
  SOURCE {
    text id PK
    text home_scope
    text list_url
  }
  ITEM {
    text source_id PK
    text item_id PK
    text title "cached copy"
    text status
  }
  TAG {
    text id PK
    text scope
    text name
  }
  TAGGING {
    text tag_id PK
    text source_id PK
    text item_id PK
  }`,
  },
  {
    id: 'c4',
    label: 'C4-style context',
    when: 'The system as one box, with the people and systems around it.',
    code: `flowchart TB
  curator(["Curator<br/><small>tags items</small>"])
  admin(["Admin<br/><small>registers apps, issues keys</small>"])
  shelf["<b>Shelf</b><br/><small>labelling service</small>"]
  recipes["Recipe site<br/><small>existing app</small>"]
  quizzes["Quiz app<br/><small>existing app</small>"]
  photos["Photo gallery<br/><small>existing app</small>"]
  curator -->|tags items| shelf
  admin -->|manages| shelf
  recipes -->|pushes changes, looks up tags| shelf
  quizzes -->|pushes changes, looks up tags| shelf
  photos -->|pushes changes, looks up tags| shelf
  shelf -.->|pulls full list nightly| recipes
  shelf -.->|pulls full list nightly| quizzes
  shelf -.->|pulls full list nightly| photos`,
  },
  {
    id: 'activity',
    label: 'Activity (flowchart)',
    when: 'A process with decisions and loops.',
    code: `flowchart TD
  start([Nightly pull starts]) --> page[Ask the app for the next page]
  page --> ok{Page arrived?}
  ok -- no --> retry{Tried 3 times?}
  retry -- no --> page
  retry -- yes --> abandon[Abandon: mark nothing missing] --> alert[Alert the admin]
  ok -- yes --> save[Update titles, note which items were seen]
  save --> more{nextCursor is null?}
  more -- no --> page
  more -- yes --> check{Would more than 20% go missing?}
  check -- yes --> hold[Hold the run and alert the admin]
  check -- no --> mark[Mark unseen items missing] --> done([Done])`,
  },
];
