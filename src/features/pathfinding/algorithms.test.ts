import { describe, expect, it } from 'vitest';
import { createRandomPathMap, solvePathfinding } from './algorithms';
import { cellKey, type PathMap } from './types';

const mapWith = (
  rows: number,
  cols: number,
  start: [number, number],
  goal: [number, number],
  walls: [number, number][] = [],
): PathMap => ({
  rows,
  cols,
  start: { row: start[0], col: start[1] },
  goal: { row: goal[0], col: goal[1] },
  walls: new Set(walls.map(([row, col]) => cellKey({ row, col }))),
});

describe('pathfinding algorithms', () => {
  const detour = mapWith(
    3,
    4,
    [1, 0],
    [1, 3],
    [
      [1, 1],
      [1, 2],
    ],
  );

  it.each(['bfs', 'dijkstra', 'astar'] as const)(
    '%s finds a shortest path on a unit-cost grid',
    (algorithm) => {
      const result = solvePathfinding(detour, algorithm);
      expect(result.found).toBe(true);
      expect(result.pathLength).toBe(5);
      expect(result.totalCost).toBe(5);
      expect(result.path.every((cell) => !detour.walls.has(cellKey(cell)))).toBe(true);
    },
  );

  it('DFS returns a valid route without promising the shortest route', () => {
    const open = mapWith(4, 5, [2, 0], [2, 4]);
    const result = solvePathfinding(open, 'dfs');
    expect(result.found).toBe(true);
    expect(result.pathLength).toBeGreaterThan(4);
  });

  it.each(['bfs', 'dfs', 'dijkstra', 'astar'] as const)(
    '%s handles a map with no solution',
    (algorithm) => {
      const blocked = mapWith(
        3,
        3,
        [0, 0],
        [2, 2],
        [
          [0, 1],
          [1, 0],
        ],
      );
      const result = solvePathfinding(blocked, algorithm);
      expect(result.found).toBe(false);
      expect(result.path).toEqual([]);
      expect(result.pathLength).toBeNull();
      expect(result.totalCost).toBeNull();
    },
  );

  it('allows start and goal to be the same cell', () => {
    const same = mapWith(2, 2, [0, 0], [0, 0]);
    const result = solvePathfinding(same, 'astar');
    expect(result).toMatchObject({ found: true, pathLength: 0, totalCost: 0, nodesVisited: 1 });
    expect(result.path).toEqual([{ row: 0, col: 0 }]);
  });

  it('does not mutate the input map and is deterministic for the same map', () => {
    const map = mapWith(
      4,
      4,
      [0, 0],
      [3, 3],
      [
        [1, 1],
        [2, 1],
      ],
    );
    const originalWalls = [...map.walls];
    const first = solvePathfinding(map, 'bfs');
    const second = solvePathfinding(map, 'bfs');
    expect([...map.walls]).toEqual(originalWalls);
    expect(first.path).toEqual(second.path);
    expect(first.nodesVisited).toBe(second.nodesVisited);
    expect(first.events).toEqual(second.events);
  });

  it('generates reproducible random maps from a seed', () => {
    expect(createRandomPathMap(10, 12, 'arena-4').walls).toEqual(
      createRandomPathMap(10, 12, 'arena-4').walls,
    );
  });

  it('rejects a start cell placed in a wall', () => {
    const invalid = mapWith(2, 2, [0, 0], [1, 1], [[0, 0]]);
    expect(() => solvePathfinding(invalid, 'bfs')).toThrow('start cell cannot be a wall');
  });
});
