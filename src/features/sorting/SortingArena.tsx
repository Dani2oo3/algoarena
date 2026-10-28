import { useMemo, useState } from 'react';
import PlaybackControls from '../../components/PlaybackControls';
import { useTracePlayer } from '../../hooks/useTracePlayer';
import { createArray, SORT_ALGORITHMS, sortWithTrace } from './algorithms';
import type { SortAlgorithmId, SortEvent, SortResult } from './types';
import type { Challenge } from '../challenges/catalog';

type Feedback = {
  readonly success: boolean;
  readonly explanation: string;
  readonly awarded?: boolean;
} | null;
interface SortingArenaProps {
  readonly initialArray: readonly number[] | undefined;
  readonly challenge: Challenge | undefined;
  readonly feedback: Feedback;
  readonly onRun: (result: SortResult) => void;
  readonly onCompare: (results: readonly SortResult[]) => void;
}

export default function SortingArena({
  initialArray,
  challenge,
  feedback,
  onRun,
  onCompare,
}: SortingArenaProps) {
  const [source, setSource] = useState<readonly number[]>(() => [
    ...(initialArray ?? createArray('random', 32, '42')),
  ]);
  const [algorithm, setAlgorithm] = useState<SortAlgorithmId>('merge');
  const [compareAlgorithm, setCompareAlgorithm] = useState<SortAlgorithmId>('quick');
  const [pattern, setPattern] = useState<'random' | 'sorted' | 'reversed' | 'duplicates'>('random');
  const [size, setSize] = useState(initialArray?.length ?? 32);
  const [seed, setSeed] = useState('42');
  const [delayMs, setDelayMs] = useState(120);
  const [result, setResult] = useState<SortResult | null>(null);
  const [comparison, setComparison] = useState<readonly SortResult[]>([]);
  const player = useTracePlayer<SortEvent>(delayMs);
  const current = useMemo(
    () => applyEvents(source, player.events.slice(0, player.cursor)),
    [player.cursor, player.events, source],
  );
  const active = challenge?.category === 'sorting' ? challenge : undefined;

  const run = (): void => {
    const next = sortWithTrace(source, algorithm);
    setResult(next);
    setComparison([]);
    player.prepare(next.events);
    onRun(next);
  };
  const compare = (): void => {
    if (algorithm === compareAlgorithm) return;
    const runs = [sortWithTrace(source, algorithm), sortWithTrace(source, compareAlgorithm)];
    setComparison(runs);
    setResult(runs[0] ?? null);
    player.prepare(runs[0]?.events ?? []);
    onCompare(runs);
  };
  const generate = (): void => {
    const next = createArray(pattern, size, seed);
    setSource(next);
    setResult(null);
    setComparison([]);
    player.prepare([]);
  };
  const resetRun = (): void => {
    setResult(null);
    setComparison([]);
    player.prepare([]);
  };

  return (
    <section className="arena-view" aria-labelledby="sorting-title">
      <div className="view-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-mark">03</span> SORTING ARENA
          </p>
          <h1 id="sorting-title">
            Order the field.
            <br />
            <span>Study every move.</span>
          </h1>
          <p className="lede">
            Use a shared input to inspect comparisons, writes, and swaps across sorting strategies.
          </p>
        </div>
        <div className="mode-stamp">
          <span className="stamp-icon">↕</span>
          <span>
            MODE <strong>SORTING</strong>
          </span>
        </div>
      </div>
      {active && (
        <div className="challenge-banner">
          <span className="eyebrow">ACTIVE CHALLENGE · {active.difficulty.toUpperCase()}</span>
          <strong>{active.title}</strong>
          <p>{active.description}</p>
          <small>{active.concept}</small>
        </div>
      )}
      {feedback && active && (
        <div
          className={`feedback ${feedback.success ? 'feedback-success' : 'feedback-hint'}`}
          role="status"
        >
          <strong>
            {feedback.success
              ? feedback.awarded
                ? `Challenge cleared · +${active.points} pts`
                : 'Challenge conditions met'
              : 'Keep working the challenge'}
          </strong>
          <span>{feedback.explanation}</span>
        </div>
      )}
      <div className="arena-layout sort-layout">
        <div className="visual-column">
          <article className="panel sort-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">LIVE ARRAY</p>
                <h2>Value distribution</h2>
              </div>
              <span className="mini-badge">{source.length} elements</span>
            </div>
            <div
              className="bars"
              role="img"
              aria-label={`Array visualization with ${source.length} values`}
            >
              {current.map((value, index) => {
                const max = Math.max(1, ...source.map(Math.abs));
                const event = player.events[Math.max(0, player.cursor - 1)];
                const indices =
                  event?.type === 'compare'
                    ? event.indices
                    : event?.type === 'swap'
                      ? [event.left, event.right]
                      : event?.type === 'write'
                        ? [event.index]
                        : [];
                const highlighted = indices.includes(index);
                const done = player.status === 'completed';
                return (
                  <div
                    key={index}
                    className={`bar ${highlighted ? 'bar-active' : ''} ${done ? 'bar-done' : ''}`}
                    style={{ height: `${Math.max(4, (Math.abs(value) / max) * 100)}%` }}
                    title={`Index ${index}: ${value}`}
                  >
                    <span>{source.length <= 24 ? value : ''}</span>
                  </div>
                );
              })}
            </div>
            <div className="array-strip">
              <span>Same source array retained for each algorithm</span>
              <button className="button button-quiet" type="button" onClick={resetRun}>
                Reset run
              </button>
            </div>
          </article>
          <article className="panel run-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">EXECUTION</p>
                <h2>Choose a sorting strategy</h2>
              </div>
              <span className={`status-pill status-${player.status}`}>
                <span aria-hidden="true" />
                {player.status}
              </span>
            </div>
            <div className="control-grid">
              <label>
                Primary algorithm
                <select
                  value={algorithm}
                  onChange={(event) => setAlgorithm(event.target.value as SortAlgorithmId)}
                >
                  {SORT_ALGORITHMS.map((item) => (
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
                  onChange={(event) => setCompareAlgorithm(event.target.value as SortAlgorithmId)}
                >
                  {SORT_ALGORITHMS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="array-generator">
              <label>
                Pattern
                <select
                  value={pattern}
                  onChange={(event) => setPattern(event.target.value as typeof pattern)}
                >
                  <option value="random">Seeded random</option>
                  <option value="sorted">Sorted</option>
                  <option value="reversed">Reversed</option>
                  <option value="duplicates">Repeated values</option>
                </select>
              </label>
              <label>
                Size
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={size}
                  onChange={(event) =>
                    setSize(Math.max(1, Math.min(72, Number(event.target.value) || 1)))
                  }
                />
              </label>
              <label>
                Seed
                <input
                  value={seed}
                  maxLength={24}
                  onChange={(event) => setSeed(event.target.value)}
                />
              </label>
              <button className="button" type="button" onClick={generate}>
                Generate data
              </button>
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
                Compare same input
              </button>
              <span className="algorithm-note">
                {SORT_ALGORITHMS.find((item) => item.id === algorithm)?.complexity}
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
                <h2>Sort report</h2>
              </div>
            </div>
            {result ? (
              <>
                <div className="result-banner result-found">
                  <strong>
                    {player.status === 'completed' ? 'Sorted output ready' : 'Run computed'}
                  </strong>
                  <span>
                    {result.algorithm.toUpperCase()} · {result.initial.length} elements
                  </span>
                </div>
                <div className="metric-grid">
                  <Metric label="Comparisons" value={result.metrics.comparisons.toLocaleString()} />
                  <Metric label="Swaps" value={result.metrics.swaps.toLocaleString()} />
                  <Metric label="Writes" value={result.metrics.writes.toLocaleString()} />
                  <Metric
                    label="Compute + trace"
                    value={`${result.metrics.computeMs.toFixed(3)} ms`}
                  />
                </div>
                <p className="metric-note">
                  A swap counts as one exchange and two writes. Merge and insertion movements count
                  as writes. Compute time includes trace generation; animation is excluded.
                </p>
              </>
            ) : (
              <p className="empty-state">
                Run a sort to inspect comparisons, movements, and compute time.
              </p>
            )}
          </article>
          <article className="panel compare-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SAME INPUT · SAME VALUES</p>
                <h2>Head-to-head</h2>
              </div>
            </div>
            {comparison.length === 2 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Algorithm</th>
                      <th>Comparisons</th>
                      <th>Swaps</th>
                      <th>Writes</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((item) => (
                      <tr key={item.algorithm}>
                        <th>{item.algorithm}</th>
                        <td>{item.metrics.comparisons}</td>
                        <td>{item.metrics.swaps}</td>
                        <td>{item.metrics.writes}</td>
                        <td>{item.metrics.computeMs.toFixed(3)} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">
                Compare two strategies using the same retained source array.
              </p>
            )}
            <p className="metric-note">
              Timings are single synchronous runs and can vary with browser load; use counts for
              algorithmic comparison.
            </p>
          </article>
          <article className="panel insight-panel">
            <p className="eyebrow">METRIC KEY</p>
            <h2>
              Count the work.
              <br />
              <span>Then watch the trace.</span>
            </h2>
            <p>
              Comparisons count value comparisons. Swaps count exchanges. Writes count assignments
              to the working array; a swap contributes two writes.
            </p>
            <p className="metric-note">
              Trace events preserve each algorithm's operations. Playback changes only how quickly
              they are shown.
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}

function applyEvents(source: readonly number[], events: readonly SortEvent[]): number[] {
  const values = [...source];
  for (const event of events) {
    if (event.type === 'swap')
      [values[event.left], values[event.right]] = [values[event.right]!, values[event.left]!];
    else if (event.type === 'write') values[event.index] = event.value;
  }
  return values;
}
function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
