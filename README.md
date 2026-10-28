# AlgoArena

**Enter the arena. Master the algorithms.** AlgoArena is a local-first interactive lab for tracing pathfinding and sorting algorithms, comparing their work, and completing challenges with verifiable objectives.

## Features

- Explore BFS, DFS, Dijkstra, and A* on an editable orthogonal grid.
- Trace Bubble, Insertion, Merge, Quick, and Heap Sort on reproducible arrays.
- Play, pause, resume, step through, reset, and adjust trace playback speed.
- Compare two algorithms on the same map or retained source array.
- Try seeded map and array generation and six session challenges.
- Earn deterministic points once per challenge during the current app session.
- Review algorithm measurements, challenge explanations, and recent activity.

## Requirements

- Node.js 22.12 or newer.
- npm 10 or newer.

The project was implemented and checked with Node.js 24.22.1 and npm 11.19.1.

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```bash
npm run build
npm run preview
```

The Vite production base is currently `/algoarena/` for a GitHub Pages project site with that repository name. Change `base` in `vite.config.ts` if the deployment path differs. No deployment is configured or triggered by this repository.

## Algorithms and trace behavior

### Pathfinding

All moves are orthogonal and have unit cost. The map generator and neighbor iteration are deterministic for the same input; neighbor order is up, right, down, left. BFS, Dijkstra, and A* find minimum-length paths on this unweighted grid. A* uses Manhattan distance. DFS uses a deterministic stack traversal and does not guarantee a shortest path. Dijkstra and A* use a binary min-heap; equal priorities are resolved by insertion order.

The grid distinguishes the start, goal, walls, frontier, visited cells, and final route. Use the editor tools to add/remove walls or move either endpoint; seeded generation, wall clearing, and the preset reset are also available. A generated random map can be unsolvable.

### Sorting

The sorting engine creates an immutable copy of the source array and emits comparison, swap, write, and completion events. Available algorithms are Bubble Sort, Insertion Sort, Merge Sort, Quick Sort, and Heap Sort. Random, sorted, reverse-sorted, and duplicate-heavy data patterns can be generated with a seed.

### Metrics

- **Pathfinding:** visited nodes count cells removed from the search frontier and marked visited (including the goal when reached); path length and cost are the number of unit moves; compute time includes search, path reconstruction, and trace generation, but excludes playback.
- **Sorting:** comparisons count value comparisons, swaps count exchanges, and writes count assignments to the working array. Each swap contributes two writes. Compute time includes sorting and event creation, but excludes playback.
- Timings measure a single synchronous run in the current browser and can vary with machine and browser load. Operation counts are better suited to compare algorithm behavior. Comparisons are available only when both runs use the same input conditions.

## Challenges and scoring

The catalog contains six pathfinding and sorting challenges across Rookie, Challenger, and Expert difficulties. Completion is evaluated against the challenge's original map or array; sorting results must be ordered and preserve every input value. Pathfinding route requirements are checked against a BFS shortest-path reference when applicable. Comparison challenges require their specified algorithms and shared inputs.

Each challenge grants its listed fixed score once per page session. Opening a challenge does not grant points, and repeating a completed challenge does not add points again. Session score, completion progress, and the short activity history are kept in memory and are cleared when the app is reloaded. There is no account, backend, persistent storage, or global leaderboard.

## Project structure

```text
src/
├── app/                 # SPA navigation, session state, dashboard, challenges, results
├── components/          # Shared playback controls
├── features/
│   ├── challenges/      # Challenge catalog, evidence checks, scoring tests
│   ├── pathfinding/     # Search algorithms, grid editor, visualization, tests
│   └── sorting/         # Sorting algorithms, trace visualization, tests
├── hooks/               # Generic event-trace playback
├── lib/                 # Seeded random generator
└── styles/              # Responsive dark interface and shared design tokens
```

## Quality checks

```bash
npm run test
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Tests use Vitest, jsdom, and React Testing Library. The current suite covers algorithm outputs and traces, seeded inputs, challenge validation, navigation, challenge scoring, grid editing, and playback controls. Playwright end-to-end tests are not configured.

## Current limitations

- Pathfinding maps are unweighted; Dijkstra and A* use the same unit movement cost as BFS.
- Compute timings are small, synchronous browser measurements, not a benchmark harness. Large benchmark workloads and Web Workers are not implemented.
- Challenge progress and recent history do not persist across reloads or devices.
- The UI is available in English and is designed for static hosting; no server, account system, or global ranking exists.
- No screenshots are included because a browser capture was not generated in this environment.

## Possible next steps

- Add optional weighted terrain and compare weighted shortest-path behavior.
- Add persistent, user-controlled local session history.
- Add browser end-to-end coverage and capture verified screenshots.
- Improve benchmark methodology for larger input sizes without blocking interaction.
