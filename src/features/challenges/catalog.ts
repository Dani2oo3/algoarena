import { cellKey, type PathMap } from '../pathfinding/types';
import type { ArrayPattern } from '../sorting/types';

export type ChallengeCategory = 'pathfinding' | 'sorting';
export type ChallengeObjective =
  'shortest-path' | 'no-route' | 'path-comparison' | 'sort-correctly' | 'sort-comparison';
export interface Challenge {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: ChallengeCategory;
  readonly difficulty: 'Rookie' | 'Challenger' | 'Expert';
  readonly points: number;
  readonly objective: ChallengeObjective;
  readonly concept: string;
  readonly pathMap?: PathMap;
  readonly array?: readonly number[];
  readonly recommendedPattern?: ArrayPattern;
  readonly requiredAlgorithms?: readonly string[];
}

const routeMap: PathMap = {
  rows: 14,
  cols: 20,
  start: { row: 7, col: 1 },
  goal: { row: 7, col: 18 },
  walls: new Set<string>(),
};
const blockedMap: PathMap = {
  rows: 8,
  cols: 12,
  start: { row: 3, col: 1 },
  goal: { row: 3, col: 10 },
  walls: new Set(
    [
      { row: 2, col: 1 },
      { row: 3, col: 2 },
      { row: 4, col: 1 },
      { row: 3, col: 0 },
    ].map(cellKey),
  ),
};
const duelMap: PathMap = {
  rows: 5,
  cols: 7,
  start: { row: 2, col: 0 },
  goal: { row: 2, col: 6 },
  walls: new Set<string>(),
};

export const CHALLENGES: readonly Challenge[] = [
  {
    id: 'route-shortest',
    title: 'Shortest Route Protocol',
    description: 'Find a minimum-length route across the open grid.',
    category: 'pathfinding',
    difficulty: 'Rookie',
    points: 100,
    objective: 'shortest-path',
    concept:
      'BFS, Dijkstra, and A* return a minimum-cost route when all moves have equal non-negative cost.',
    pathMap: routeMap,
    requiredAlgorithms: ['bfs', 'dijkstra', 'astar'],
  },
  {
    id: 'blocked-proof',
    title: 'Prove the Dead End',
    description: 'Show that the start is sealed off and no route exists.',
    category: 'pathfinding',
    difficulty: 'Challenger',
    points: 125,
    objective: 'no-route',
    concept: 'A completed search with an exhausted frontier proves that no reachable route exists.',
    pathMap: blockedMap,
  },
  {
    id: 'frontier-duel',
    title: 'Frontier Duel',
    description: 'Compare BFS and DFS on the same open map. Explain why their routes can differ.',
    category: 'pathfinding',
    difficulty: 'Challenger',
    points: 150,
    objective: 'path-comparison',
    concept:
      'BFS explores by distance and guarantees a shortest path here; DFS follows a branch before backtracking.',
    pathMap: duelMap,
    requiredAlgorithms: ['bfs', 'dfs'],
  },
  {
    id: 'repeat-storm',
    title: 'Repeat Storm',
    description: 'Sort an array containing repeated and negative values.',
    category: 'sorting',
    difficulty: 'Rookie',
    points: 80,
    objective: 'sort-correctly',
    concept: 'A correct sort preserves every value, including duplicates and negatives.',
    array: [9, 3, 9, -2, 4, 4, 1],
  },
  {
    id: 'reverse-drive',
    title: 'Reverse Drive',
    description: 'Sort a descending sequence into ascending order.',
    category: 'sorting',
    difficulty: 'Rookie',
    points: 90,
    objective: 'sort-correctly',
    concept: 'Reverse-ordered input can expose the quadratic work in simple comparison sorts.',
    array: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    recommendedPattern: 'reversed',
  },
  {
    id: 'merge-quick-showdown',
    title: 'Merge vs Quick Showdown',
    description: 'Run Merge Sort and Quick Sort against exactly the same input.',
    category: 'sorting',
    difficulty: 'Expert',
    points: 160,
    objective: 'sort-comparison',
    concept:
      'Both algorithms can sort correctly while their comparison and movement counts differ for this input.',
    array: [42, 8, 31, 8, 17, 55, 2, 23, 17, 11],
    requiredAlgorithms: ['merge', 'quick'],
  },
];

export const getChallenge = (id: string | null): Challenge | undefined =>
  CHALLENGES.find((challenge) => challenge.id === id);
