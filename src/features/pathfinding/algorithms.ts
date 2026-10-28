import { createRandom } from '../../lib/seededRandom';
import {
  cellKey,
  type Cell,
  type PathAlgorithmId,
  type PathEvent,
  type PathMap,
  type PathfindingResult,
  pathMapSignature,
} from './types';

const NEIGHBOR_OFFSETS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
];

function validateMap(map: PathMap): void {
  if (!Number.isInteger(map.rows) || !Number.isInteger(map.cols) || map.rows < 1 || map.cols < 1) {
    throw new Error('Grid dimensions must be positive integers.');
  }
  for (const [label, cell] of [
    ['start', map.start],
    ['goal', map.goal],
  ] as const) {
    if (cell.row < 0 || cell.row >= map.rows || cell.col < 0 || cell.col >= map.cols) {
      throw new Error(`The ${label} cell is outside the grid.`);
    }
    if (map.walls.has(cellKey(cell))) throw new Error(`The ${label} cell cannot be a wall.`);
  }
}

function neighbors(cell: Cell, map: PathMap): Cell[] {
  return NEIGHBOR_OFFSETS.map((offset) => ({
    row: cell.row + offset.row,
    col: cell.col + offset.col,
  })).filter(
    (next) => next.row >= 0 && next.row < map.rows && next.col >= 0 && next.col < map.cols,
  );
}

function makeResult(
  algorithm: PathAlgorithmId,
  map: PathMap,
  events: PathEvent[],
  parents: Map<string, Cell>,
  visited: number,
  started: number,
): PathfindingResult {
  const startKey = cellKey(map.start);
  const goalKey = cellKey(map.goal);
  const found = startKey === goalKey || parents.has(goalKey);
  const reversed: Cell[] = [];
  if (found) {
    let cursor = map.goal;
    reversed.push(cursor);
    while (cellKey(cursor) !== startKey) {
      const parent = parents.get(cellKey(cursor));
      if (!parent) break;
      cursor = parent;
      reversed.push(cursor);
    }
  }
  const path = found ? reversed.reverse() : [];
  for (const cell of path) events.push({ type: 'path', cell });
  const computeMs = Number((performance.now() - started).toFixed(3));
  return {
    algorithm,
    mapSignature: pathMapSignature(map),
    found,
    path,
    nodesVisited: visited,
    pathLength: found ? Math.max(0, path.length - 1) : null,
    totalCost: found ? Math.max(0, path.length - 1) : null,
    computeMs,
    events,
  };
}

interface HeapItem {
  readonly cell: Cell;
  readonly score: number;
  readonly distance: number;
  readonly order: number;
}
class MinHeap {
  private readonly items: HeapItem[] = [];
  private order = 0;
  push(cell: Cell, score: number, distance: number): void {
    const item = { cell, score, distance, order: this.order++ };
    this.items.push(item);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!this.less(this.items[index]!, this.items[parent]!)) break;
      [this.items[index], this.items[parent]] = [this.items[parent]!, this.items[index]!];
      index = parent;
    }
  }
  pop(): HeapItem | undefined {
    if (this.items.length === 0) return undefined;
    const first = this.items[0]!;
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (left < this.items.length && this.less(this.items[left]!, this.items[smallest]!))
          smallest = left;
        if (right < this.items.length && this.less(this.items[right]!, this.items[smallest]!))
          smallest = right;
        if (smallest === index) break;
        [this.items[index], this.items[smallest]] = [this.items[smallest]!, this.items[index]!];
        index = smallest;
      }
    }
    return first;
  }
  private less(left: HeapItem, right: HeapItem): boolean {
    return left.score < right.score || (left.score === right.score && left.order < right.order);
  }
}

export function solvePathfinding(map: PathMap, algorithm: PathAlgorithmId): PathfindingResult {
  validateMap(map);
  const started = performance.now();
  const elapsed = (): number => Number((performance.now() - started).toFixed(3));
  const events: PathEvent[] = [{ type: 'frontier', cell: map.start }];
  const parents = new Map<string, Cell>();
  if (cellKey(map.start) === cellKey(map.goal)) {
    events.push({ type: 'visit', cell: map.start }, { type: 'path', cell: map.start });
    return {
      algorithm,
      mapSignature: pathMapSignature(map),
      found: true,
      path: [map.start],
      nodesVisited: 1,
      pathLength: 0,
      totalCost: 0,
      computeMs: elapsed(),
      events,
    };
  }
  let visitedCount = 0;
  if (algorithm === 'bfs' || algorithm === 'dfs') {
    const pending: Cell[] = [map.start];
    const discovered = new Set<string>([cellKey(map.start)]);
    let cursor = 0;
    while (algorithm === 'bfs' ? cursor < pending.length : pending.length > 0) {
      const current = algorithm === 'bfs' ? pending[cursor++]! : pending.pop()!;
      events.push({ type: 'visit', cell: current });
      visitedCount += 1;
      if (cellKey(current) === cellKey(map.goal)) break;
      const adjacent = neighbors(current, map);
      if (algorithm === 'dfs') adjacent.reverse();
      for (const next of adjacent) {
        const key = cellKey(next);
        if (map.walls.has(key) || discovered.has(key)) continue;
        discovered.add(key);
        parents.set(key, current);
        pending.push(next);
        events.push({ type: 'frontier', cell: next });
      }
    }
  } else {
    const queue = new MinHeap();
    const distances = new Map<string, number>([[cellKey(map.start), 0]]);
    const settled = new Set<string>();
    queue.push(map.start, 0, 0);
    while (true) {
      const current = queue.pop();
      if (!current) break;
      const currentKey = cellKey(current.cell);
      if (settled.has(currentKey) || current.distance !== distances.get(currentKey)) continue;
      settled.add(currentKey);
      events.push({ type: 'visit', cell: current.cell });
      visitedCount += 1;
      if (currentKey === cellKey(map.goal)) break;
      for (const next of neighbors(current.cell, map)) {
        const key = cellKey(next);
        if (map.walls.has(key) || settled.has(key)) continue;
        const nextDistance = current.distance + 1;
        if (nextDistance >= (distances.get(key) ?? Number.POSITIVE_INFINITY)) continue;
        distances.set(key, nextDistance);
        parents.set(key, current.cell);
        const heuristic =
          algorithm === 'astar'
            ? Math.abs(next.row - map.goal.row) + Math.abs(next.col - map.goal.col)
            : 0;
        queue.push(next, nextDistance + heuristic, nextDistance);
        events.push({ type: 'frontier', cell: next });
      }
    }
  }
  return makeResult(algorithm, map, events, parents, visitedCount, started);
}

export function createDefaultPathMap(rows = 14, cols = 20): PathMap {
  const start = { row: Math.floor(rows / 2), col: 1 };
  const goal = { row: Math.floor(rows / 2), col: cols - 2 };
  const walls = new Set<string>();
  const barriers = [Math.floor(cols * 0.25), Math.floor(cols * 0.47), Math.floor(cols * 0.68)];
  const gaps = [Math.floor(rows * 0.2), Math.floor(rows * 0.72), Math.floor(rows * 0.34)];
  barriers.forEach((col, index) => {
    for (let row = 0; row < rows; row += 1) {
      if (row !== gaps[index] && row !== gaps[index]! - 1 && col > 1 && col < cols - 2)
        walls.add(cellKey({ row, col }));
    }
  });
  return { rows, cols, start, goal, walls };
}

export function createRandomPathMap(
  rows: number,
  cols: number,
  seed: string | number,
  density = 0.24,
): PathMap {
  const random = createRandom(seed);
  const start = { row: Math.floor(rows / 2), col: 1 };
  const goal = { row: Math.floor(rows / 2), col: cols - 2 };
  const walls = new Set<string>();
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = { row, col };
      if (cellKey(cell) !== cellKey(start) && cellKey(cell) !== cellKey(goal) && random() < density)
        walls.add(cellKey(cell));
    }
  }
  return { rows, cols, start, goal, walls };
}

export function clonePathMap(map: PathMap): PathMap {
  return { ...map, start: { ...map.start }, goal: { ...map.goal }, walls: new Set(map.walls) };
}
