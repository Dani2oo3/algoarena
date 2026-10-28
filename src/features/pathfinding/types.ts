export interface Cell {
  readonly row: number;
  readonly col: number;
}
export interface PathMap {
  readonly rows: number;
  readonly cols: number;
  readonly start: Cell;
  readonly goal: Cell;
  readonly walls: ReadonlySet<string>;
}
export type PathAlgorithmId = 'bfs' | 'dfs' | 'dijkstra' | 'astar';
export type PathEventType = 'frontier' | 'visit' | 'path';
export interface PathEvent {
  readonly type: PathEventType;
  readonly cell: Cell;
}
export interface PathfindingResult {
  readonly algorithm: PathAlgorithmId;
  readonly mapSignature: string;
  readonly found: boolean;
  readonly path: readonly Cell[];
  readonly nodesVisited: number;
  readonly pathLength: number | null;
  readonly totalCost: number | null;
  readonly computeMs: number;
  readonly events: readonly PathEvent[];
}
export const cellKey = ({ row, col }: Cell): string => `${row},${col}`;
export const sameCell = (left: Cell, right: Cell): boolean =>
  left.row === right.row && left.col === right.col;

export const pathMapSignature = (map: PathMap): string =>
  `${map.rows}x${map.cols}|${cellKey(map.start)}|${cellKey(map.goal)}|${[...map.walls].sort().join(';')}`;
