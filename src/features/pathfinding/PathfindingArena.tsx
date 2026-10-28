import { useEffect, useMemo, useRef, useState } from 'react';
import PlaybackControls from '../../components/PlaybackControls';
import { useTracePlayer } from '../../hooks/useTracePlayer';
import {
  cellKey,
  sameCell,
  type Cell,
  type PathAlgorithmId,
  type PathEvent,
  type PathMap,
  type PathfindingResult,
} from './types';
import {
  clonePathMap,
  createDefaultPathMap,
  createRandomPathMap,
  solvePathfinding,
} from './algorithms';
import type { Challenge } from '../challenges/catalog';

const algorithms: readonly { id: PathAlgorithmId; label: string; guarantee: string }[] = [
  { id: 'bfs', label: 'Breadth-First Search', guarantee: 'Shortest on unit-cost grids' },
  { id: 'dfs', label: 'Depth-First Search', guarantee: 'Does not guarantee shortest' },
  { id: 'dijkstra', label: "Dijkstra's Algorithm", guarantee: 'Shortest non-negative path' },
  { id: 'astar', label: 'A* Search', guarantee: 'Admissible Manhattan heuristic' },
];
type EditTool = 'wall' | 'start' | 'goal';
type Brush = { readonly tool: EditTool; readonly wallValue: boolean | null };
type Feedback = {
  readonly success: boolean;
  readonly explanation: string;
  readonly awarded?: boolean;
} | null;

interface PathfindingArenaProps {
  readonly initialMap?: PathMap;
  readonly challenge?: Challenge;
  readonly feedback: Feedback;
  readonly onRun: (result: PathfindingResult) => void;
  readonly onCompare: (results: readonly PathfindingResult[]) => void;
}

function mapSizeLabel(map: PathMap): string {
  return `${map.rows} × ${map.cols}`;
}

export default function PathfindingArena({
  initialMap,
  challenge,
  feedback,
  onRun,
  onCompare,
}: PathfindingArenaProps) {
  const [map, setMap] = useState<PathMap>(() => clonePathMap(initialMap ?? createDefaultPathMap()));
  const [algorithm, setAlgorithm] = useState<PathAlgorithmId>('astar');
  const [compareAlgorithm, setCompareAlgorithm] = useState<PathAlgorithmId>('bfs');
  const [tool, setTool] = useState<EditTool>('wall');
  const [seed, setSeed] = useState('42');
  const [delayMs, setDelayMs] = useState(120);
  const [result, setResult] = useState<PathfindingResult | null>(null);
  const [comparison, setComparison] = useState<readonly PathfindingResult[]>([]);
  const [focusedCell, setFocusedCell] = useState<Cell>(map.start);
  const brush = useRef<Brush | null>(null);
  const cellButtons = useRef(new Map<string, HTMLButtonElement>());
  const player = useTracePlayer<PathEvent>(delayMs);

  useEffect(() => {
    const release = () => {
      brush.current = null;
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, []);

  const visualState = useMemo(() => {
    const frontier = new Set<string>();
    const visited = new Set<string>();
    const path = new Set<string>();
    for (const event of player.events.slice(0, player.cursor)) {
      const key = cellKey(event.cell);
      if (event.type === 'frontier') frontier.add(key);
      if (event.type === 'visit') {
        frontier.delete(key);
        visited.add(key);
      }
      if (event.type === 'path') path.add(key);
    }
    return { frontier, visited, path };
  }, [player.cursor, player.events]);

  const setCell = (cell: Cell, activeTool: EditTool, wallValue: boolean | null): void => {
    setMap((current) => {
      const key = cellKey(cell);
      if (activeTool === 'start') {
        if (sameCell(cell, current.goal) || current.walls.has(key)) return current;
        return { ...current, start: cell };
      }
      if (activeTool === 'goal') {
        if (sameCell(cell, current.start) || current.walls.has(key)) return current;
        return { ...current, goal: cell };
      }
      const walls = new Set(current.walls);
      if (wallValue && !sameCell(cell, current.start) && !sameCell(cell, current.goal))
        walls.add(key);
      else walls.delete(key);
      return { ...current, walls };
    });
    setResult(null);
    setComparison([]);
    player.reset();
  };

  const beginPaint = (cell: Cell, event: React.PointerEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.currentTarget.focus();
    const wallValue = tool === 'wall' ? !map.walls.has(cellKey(cell)) : null;
    brush.current = { tool, wallValue };
    setCell(cell, tool, wallValue);
  };

  const handleKey = (event: React.KeyboardEvent<HTMLButtonElement>, cell: Cell): void => {
    const delta: Record<string, Cell> = {
      ArrowUp: { row: -1, col: 0 },
      ArrowRight: { row: 0, col: 1 },
      ArrowDown: { row: 1, col: 0 },
      ArrowLeft: { row: 0, col: -1 },
    };
    const offset = delta[event.key];
    if (offset) {
      event.preventDefault();
      const next = { row: cell.row + offset.row, col: cell.col + offset.col };
      if (next.row >= 0 && next.row < map.rows && next.col >= 0 && next.col < map.cols) {
        cellButtons.current.get(cellKey(next))?.focus();
      }
    } else if (event.key === 'Escape') {
      brush.current = null;
    }
  };

  const run = (): void => {
    const next = solvePathfinding(map, algorithm);
    setResult(next);
    setComparison([]);
    player.prepare(next.events);
    onRun(next);
  };

  const compare = (): void => {
    if (algorithm === compareAlgorithm) return;
    const results = [solvePathfinding(map, algorithm), solvePathfinding(map, compareAlgorithm)];
    setComparison(results);
    setResult(results[0] ?? null);
    player.prepare(results[0]?.events ?? []);
    onCompare(results);
  };

  const changeSize = (value: string): void => {
    const [rows, cols] = value.split('x').map(Number);
    if (rows && cols) {
      setMap(createDefaultPathMap(rows, cols));
      setResult(null);
      setComparison([]);
      player.prepare([]);
    }
  };

  const resetMap = (): void => {
    setMap(createDefaultPathMap(map.rows, map.cols));
    setResult(null);
    setComparison([]);
    player.prepare([]);
  };

  const clearWalls = (): void => {
    setMap((current) => ({ ...current, walls: new Set<string>() }));
    setResult(null);
    setComparison([]);
    player.prepare([]);
  };

  const randomize = (): void => {
    setMap(createRandomPathMap(map.rows, map.cols, seed));
    setResult(null);
    setComparison([]);
    player.prepare([]);
  };

  const cells = useMemo(
    () =>
      Array.from({ length: map.rows }, (_, row) =>
        Array.from({ length: map.cols }, (_, col) => ({ row, col })),
      ),
    [map.cols, map.rows],
  );

  return (
    <section className="arena-view" aria-labelledby="pathfinding-title">
      <div className="view-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-mark">02</span> PATHFINDING ARENA
          </p>
          <h1 id="pathfinding-title">
            Map the route.
            <br />
            <span>Read the frontier.</span>
          </h1>
          <p className="lede">
            Watch search strategies expand, compare their routes, then make the same map your
            proving ground.
          </p>
        </div>
        <div className="mode-stamp">
          <span className="stamp-icon">⌖</span>
          <span>
            MODE <strong>PATHFINDING</strong>
          </span>
        </div>
      </div>
      {challenge && challenge.category === 'pathfinding' && (
        <div className="challenge-banner">
          <span className="eyebrow">ACTIVE CHALLENGE · {challenge.difficulty.toUpperCase()}</span>
          <strong>{challenge.title}</strong>
          <p>{challenge.description}</p>
          <small>{challenge.concept}</small>
        </div>
      )}
      {feedback && challenge?.category === 'pathfinding' && (
        <div
          className={`feedback ${feedback.success ? 'feedback-success' : 'feedback-hint'}`}
          role="status"
        >
          <strong>
            {feedback.success
              ? feedback.awarded
                ? `Challenge cleared · +${challenge.points} pts`
                : 'Challenge conditions met'
              : 'Keep working the challenge'}
          </strong>
          <span>{feedback.explanation}</span>
        </div>
      )}
      <div className="arena-layout path-layout">
        <div className="visual-column">
          <article className="panel grid-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">LIVE GRID</p>
                <h2>Search surface</h2>
              </div>
              <span className="mini-badge">{mapSizeLabel(map)}</span>
            </div>
            <div className="grid-tools">
              <div className="tool-group" role="group" aria-label="Grid editing tool">
                <button
                  type="button"
                  className={tool === 'wall' ? 'tool-active' : ''}
                  aria-pressed={tool === 'wall'}
                  onClick={() => setTool('wall')}
                >
                  Wall
                </button>
                <button
                  type="button"
                  className={tool === 'start' ? 'tool-active' : ''}
                  aria-pressed={tool === 'start'}
                  onClick={() => setTool('start')}
                >
                  Move start
                </button>
                <button
                  type="button"
                  className={tool === 'goal' ? 'tool-active' : ''}
                  aria-pressed={tool === 'goal'}
                  onClick={() => setTool('goal')}
                >
                  Move goal
                </button>
              </div>
              <label className="compact-field">
                Grid size
                <select
                  aria-label="Grid size"
                  value={
                    ['10x14', '14x20', '18x26'].includes(`${map.rows}x${map.cols}`)
                      ? `${map.rows}x${map.cols}`
                      : 'custom'
                  }
                  onChange={(event) => changeSize(event.target.value)}
                >
                  <option value="custom" disabled>
                    Challenge grid
                  </option>
                  <option value="10x14">10 × 14</option>
                  <option value="14x20">14 × 20</option>
                  <option value="18x26">18 × 26</option>
                </select>
              </label>
            </div>
            <div
              className="grid-area"
              onPointerUp={() => {
                brush.current = null;
              }}
              onPointerLeave={() => {
                brush.current = null;
              }}
            >
              <div
                className="path-grid"
                role="grid"
                aria-label={`Pathfinding grid, ${map.rows} rows by ${map.cols} columns`}
                style={{ '--grid-cols': map.cols } as React.CSSProperties}
              >
                {cells.map((rowCells, row) => (
                  <div role="row" className="grid-row" key={row}>
                    {rowCells.map((cell) => {
                      const key = cellKey(cell);
                      const startCell = sameCell(cell, map.start);
                      const goalCell = sameCell(cell, map.goal);
                      const wall = map.walls.has(key);
                      const nodeClass = startCell
                        ? 'node-start'
                        : goalCell
                          ? 'node-goal'
                          : wall
                            ? 'node-wall'
                            : visualState.path.has(key)
                              ? 'node-path'
                              : visualState.frontier.has(key)
                                ? 'node-frontier'
                                : visualState.visited.has(key)
                                  ? 'node-visited'
                                  : '';
                      const label = startCell
                        ? 'start'
                        : goalCell
                          ? 'goal'
                          : wall
                            ? 'obstacle'
                            : visualState.path.has(key)
                              ? 'path'
                              : visualState.frontier.has(key)
                                ? 'frontier'
                                : visualState.visited.has(key)
                                  ? 'visited'
                                  : 'empty';
                      return (
                        <button
                          key={key}
                          ref={(node) => {
                            if (node) cellButtons.current.set(key, node);
                            else cellButtons.current.delete(key);
                          }}
                          type="button"
                          role="gridcell"
                          tabIndex={sameCell(cell, focusedCell) ? 0 : -1}
                          className={`grid-cell ${nodeClass}`}
                          aria-label={`Row ${row + 1}, column ${cell.col + 1}: ${label}`}
                          onFocus={() => setFocusedCell(cell)}
                          onPointerDown={(event) => beginPaint(cell, event)}
                          onPointerEnter={() => {
                            const active = brush.current;
                            if (active) setCell(cell, active.tool, active.wallValue);
                          }}
                          onPointerUp={() => {
                            brush.current = null;
                          }}
                          onClick={(event) => {
                            if (event.detail === 0)
                              setCell(cell, tool, tool === 'wall' ? !map.walls.has(key) : null);
                          }}
                          onKeyDown={(event) => handleKey(event, cell)}
                        >
                          {startCell ? 'S' : goalCell ? 'G' : wall ? '×' : ''}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid-actions">
              <label className="compact-field seed-field">
                Seed
                <input
                  aria-label="Map seed"
                  value={seed}
                  onChange={(event) => setSeed(event.target.value)}
                  maxLength={24}
                />
              </label>
              <button className="button" type="button" onClick={randomize}>
                Generate seeded map
              </button>
              <button className="button button-quiet" type="button" onClick={clearWalls}>
                Clear walls
              </button>
              <button className="button button-quiet" type="button" onClick={resetMap}>
                Restore preset
              </button>
            </div>
            <div className="legend" aria-label="Grid legend">
              <span>
                <i className="legend-start">S</i>Start
              </span>
              <span>
                <i className="legend-goal">G</i>Goal
              </span>
              <span>
                <i className="legend-wall">×</i>Wall
              </span>
              <span>
                <i className="legend-frontier" />
                Frontier
              </span>
              <span>
                <i className="legend-visited" />
                Visited
              </span>
              <span>
                <i className="legend-path" />
                Path
              </span>
            </div>
          </article>
          <article className="panel run-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">EXECUTION</p>
                <h2>Choose a search strategy</h2>
              </div>
              <span className={`status-pill status-${player.status}`}>
                <span aria-hidden="true" />
                {player.status}
              </span>
            </div>
            <div className="control-grid path-selectors">
              <label>
                Primary algorithm
                <select
                  value={algorithm}
                  onChange={(event) => setAlgorithm(event.target.value as PathAlgorithmId)}
                >
                  {algorithms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Compare against
                <select
                  value={compareAlgorithm}
                  onChange={(event) => setCompareAlgorithm(event.target.value as PathAlgorithmId)}
                >
                  {algorithms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="run-actions">
              <button className="button button-primary" type="button" onClick={run}>
                Run algorithm
              </button>
              <button
                className="button"
                type="button"
                disabled={algorithm === compareAlgorithm}
                onClick={compare}
              >
                Compare on same map
              </button>
              <span className="algorithm-note">
                {algorithms.find((item) => item.id === algorithm)?.guarantee}
              </span>
            </div>
            <PlaybackControls
              status={player.status}
              cursor={player.cursor}
              total={player.events.length}
              progress={player.progress}
              delayMs={delayMs}
              onDelayChange={setDelayMs}
              onPlay={player.play}
              onPause={player.pause}
              onResume={player.resume}
              onStep={player.step}
              onReset={player.reset}
            />
          </article>
        </div>
        <aside className="data-column">
          <article className="panel metrics-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">RUN METRICS</p>
                <h2>Search report</h2>
              </div>
            </div>
            {result ? (
              <>
                <div className={`result-banner ${result.found ? 'result-found' : 'result-missed'}`}>
                  <strong>{result.found ? 'Route found' : 'No route found'}</strong>
                  <span>
                    {result.algorithm.toUpperCase()} · {result.events.length.toLocaleString()} trace
                    steps
                  </span>
                </div>
                <div className="metric-grid">
                  <Metric label="Nodes visited" value={result.nodesVisited.toLocaleString()} />
                  <Metric
                    label="Path length"
                    value={result.pathLength === null ? '—' : `${result.pathLength} steps`}
                  />
                  <Metric
                    label="Total cost"
                    value={result.totalCost === null ? '—' : `${result.totalCost}`}
                  />
                  <Metric label="Compute + trace" value={`${result.computeMs.toFixed(3)} ms`} />
                </div>
                <p className="metric-note">
                  Compute time measures synchronous search and event generation; animation playback
                  is excluded. Moves are orthogonal and each costs 1.
                </p>
              </>
            ) : (
              <EmptyState text="Run a search to see visited nodes, path cost, and compute time." />
            )}
          </article>
          <article className="panel compare-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SAME MAP · SAME COSTS</p>
                <h2>Head-to-head</h2>
              </div>
            </div>
            {comparison.length === 2 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Algorithm</th>
                      <th>Route</th>
                      <th>Length</th>
                      <th>Visited</th>
                      <th>Compute</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((item) => (
                      <tr key={item.algorithm}>
                        <th>{item.algorithm.toUpperCase()}</th>
                        <td>{item.found ? 'Found' : 'None'}</td>
                        <td>{item.pathLength ?? '—'}</td>
                        <td>{item.nodesVisited}</td>
                        <td>{item.computeMs.toFixed(3)} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="Choose two different strategies and compare them on the current grid." />
            )}
            <p className="metric-note">
              Neighbor order is up, right, down, left. Priority-queue ties use insertion order for
              deterministic traces.
            </p>
          </article>
          <article className="panel insight-panel">
            <p className="eyebrow">FIELD NOTE</p>
            <h2>
              Same terrain.
              <br />
              <span>Different search behavior.</span>
            </h2>
            <p>
              BFS explores by layers. DFS follows a branch first. Dijkstra and A* use a stable
              priority queue; on this unweighted grid each move has unit cost.
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function EmptyState({ text }: { readonly text: string }) {
  return <p className="empty-state">{text}</p>;
}
