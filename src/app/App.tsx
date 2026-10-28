import { useMemo, useState } from 'react';
import PathfindingArena from '../features/pathfinding/PathfindingArena';
import SortingArena from '../features/sorting/SortingArena';
import { CHALLENGES, getChallenge, type Challenge } from '../features/challenges/catalog';
import { evaluateChallenge, type ChallengeEvidence } from '../features/challenges/evaluation';
import type { PathfindingResult } from '../features/pathfinding/types';
import type { SortResult } from '../features/sorting/types';

type View = 'dashboard' | 'pathfinding' | 'sorting' | 'challenges' | 'results';
interface Activity {
  readonly label: string;
  readonly detail: string;
}
interface Completion {
  readonly challenge: Challenge;
  readonly explanation: string;
}

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pathResult, setPathResult] = useState<PathfindingResult | undefined>();
  const [pathComparison, setPathComparison] = useState<readonly PathfindingResult[] | undefined>();
  const [sortResult, setSortResult] = useState<SortResult | undefined>();
  const [sortComparison, setSortComparison] = useState<readonly SortResult[] | undefined>();
  const [completed, setCompleted] = useState<readonly Completion[]>([]);
  const [activity, setActivity] = useState<readonly Activity[]>([]);
  const activeChallenge = getChallenge(activeId);
  const score = useMemo(
    () => completed.reduce((total, entry) => total + entry.challenge.points, 0),
    [completed],
  );
  const progress = `${completed.length}/${CHALLENGES.length}`;
  const evidence: ChallengeEvidence = {
    ...(pathResult ? { pathResult } : {}),
    ...(pathComparison ? { pathComparison } : {}),
    ...(sortResult ? { sortResult } : {}),
    ...(sortComparison ? { sortComparison } : {}),
  };
  const feedback = activeChallenge ? evaluateChallenge(activeChallenge, evidence) : null;

  const record = (label: string, detail: string): void =>
    setActivity((items) => [{ label, detail }, ...items].slice(0, 5));
  const awardIfValid = (
    challenge: Challenge | undefined,
    evaluation: ReturnType<typeof evaluateChallenge>,
  ): boolean => {
    if (
      !challenge ||
      !evaluation.success ||
      completed.some((entry) => entry.challenge.id === challenge.id)
    )
      return false;
    setCompleted((items) => [...items, { challenge, explanation: evaluation.explanation }]);
    record(challenge.title, `Challenge cleared · +${challenge.points} points`);
    return true;
  };
  const handlePathRun = (result: PathfindingResult): void => {
    setPathResult(result);
    setPathComparison(undefined);
    setSortResult(undefined);
    setSortComparison(undefined);
    const evaluation = activeChallenge
      ? evaluateChallenge(activeChallenge, { pathResult: result })
      : null;
    const awarded = evaluation ? awardIfValid(activeChallenge, evaluation) : false;
    record(
      `${result.algorithm.toUpperCase()} search`,
      result.found
        ? `${result.pathLength} steps · ${result.nodesVisited} visited`
        : 'No route found',
    );
    if (awarded) setView('results');
  };
  const handlePathCompare = (results: readonly PathfindingResult[]): void => {
    setPathComparison(results);
    setPathResult(results[0]);
    setSortResult(undefined);
    setSortComparison(undefined);
    const evaluation = activeChallenge
      ? evaluateChallenge(activeChallenge, { pathComparison: results })
      : null;
    const awarded = evaluation ? awardIfValid(activeChallenge, evaluation) : false;
    record(
      'Pathfinding comparison',
      results
        .map((result) => `${result.algorithm.toUpperCase()}: ${result.pathLength ?? 'no route'}`)
        .join(' vs '),
    );
    if (awarded) setView('results');
  };
  const handleSortRun = (result: SortResult): void => {
    setSortResult(result);
    setSortComparison(undefined);
    setPathResult(undefined);
    setPathComparison(undefined);
    const evaluation = activeChallenge
      ? evaluateChallenge(activeChallenge, { sortResult: result })
      : null;
    const awarded = evaluation ? awardIfValid(activeChallenge, evaluation) : false;
    record(
      `${result.algorithm} sort`,
      `${result.initial.length} elements · ${result.metrics.comparisons} comparisons`,
    );
    if (awarded) setView('results');
  };
  const handleSortCompare = (results: readonly SortResult[]): void => {
    setSortComparison(results);
    setSortResult(results[0]);
    setPathResult(undefined);
    setPathComparison(undefined);
    const evaluation = activeChallenge
      ? evaluateChallenge(activeChallenge, { sortComparison: results })
      : null;
    const awarded = evaluation ? awardIfValid(activeChallenge, evaluation) : false;
    record(
      'Sorting comparison',
      results
        .map((result) => `${result.algorithm}: ${result.metrics.comparisons} comparisons`)
        .join(' vs '),
    );
    if (awarded) setView('results');
  };
  const startChallenge = (challenge: Challenge): void => {
    setActiveId(challenge.id);
    setPathResult(undefined);
    setPathComparison(undefined);
    setSortResult(undefined);
    setSortComparison(undefined);
    setView(challenge.category);
  };
  const navigate = (next: View): void => {
    setView(next);
    if (
      next === 'dashboard' ||
      next === 'challenges' ||
      (activeChallenge !== undefined && next !== activeChallenge.category)
    ) {
      setActiveId(null);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => navigate('dashboard')}
          aria-label="AlgoArena dashboard"
        >
          <span className="brand-mark">A</span>
          <span>
            Algo<span className="brand-accent">Arena</span>
            <small>ALGORITHM LAB</small>
          </span>
        </button>
        <nav aria-label="Main navigation">
          {(['dashboard', 'pathfinding', 'sorting', 'challenges', 'results'] as const).map(
            (item) => (
              <button
                key={item}
                type="button"
                className={view === item ? 'nav-active' : ''}
                aria-current={view === item ? 'page' : undefined}
                onClick={() => navigate(item)}
              >
                {item === 'dashboard'
                  ? 'Dashboard'
                  : item === 'pathfinding'
                    ? 'Pathfinding'
                    : item === 'sorting'
                      ? 'Sorting'
                      : item === 'challenges'
                        ? 'Challenges'
                        : 'Results'}
              </button>
            ),
          )}
        </nav>
        <div className="session-score">
          <span>SESSION SCORE</span>
          <strong>
            {score.toLocaleString()} <i>PTS</i>
          </strong>
        </div>
      </header>
      <main id="main-content">
        {view === 'dashboard' && (
          <Dashboard
            score={score}
            progress={progress}
            activity={activity}
            onNavigate={navigate}
            onChallenge={startChallenge}
          />
        )}
        {view === 'pathfinding' && (
          <PathfindingArena
            key={activeChallenge?.id ?? 'free-path'}
            {...(activeChallenge?.pathMap ? { initialMap: activeChallenge.pathMap } : {})}
            {...(activeChallenge ? { challenge: activeChallenge } : {})}
            feedback={feedback}
            onRun={handlePathRun}
            onCompare={handlePathCompare}
          />
        )}
        {view === 'sorting' && (
          <SortingArena
            key={activeChallenge?.id ?? 'free-sort'}
            initialArray={activeChallenge?.array}
            challenge={activeChallenge}
            feedback={feedback}
            onRun={handleSortRun}
            onCompare={handleSortCompare}
          />
        )}
        {view === 'challenges' && <ChallengeBoard completed={completed} onStart={startChallenge} />}
        {view === 'results' && (
          <Results
            score={score}
            completed={completed}
            activity={activity}
            pathResult={pathResult}
            pathComparison={pathComparison}
            sortResult={sortResult}
            sortComparison={sortComparison}
            onNavigate={navigate}
          />
        )}
      </main>
      <footer className="footer">
        <span>
          AlgoArena <i>·</i> An interactive algorithm lab
        </span>
        <span>
          Local session only <i>·</i> No account required
        </span>
      </footer>
    </div>
  );
}

function Dashboard({
  score,
  progress,
  activity,
  onNavigate,
  onChallenge,
}: {
  score: number;
  progress: string;
  activity: readonly Activity[];
  onNavigate: (view: View) => void;
  onChallenge: (challenge: Challenge) => void;
}) {
  return (
    <section className="dashboard-view">
      <div className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-mark">01</span> THE ALGORITHM ARENA
          </p>
          <h1>
            Enter the arena.
            <br />
            <span>Master the algorithms.</span>
          </h1>
          <p className="lede">
            A hands-on lab to explore search and sorting strategies, compare their work, and solve
            verifiable challenges.
          </p>
          <div className="hero-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() => onNavigate('pathfinding')}
            >
              Explore pathfinding <span aria-hidden="true">↗</span>
            </button>
            <button className="button" type="button" onClick={() => onNavigate('sorting')}>
              Enter sorting arena
            </button>
          </div>
          <div className="hero-tags">
            <span>04 PATHFINDING ALGORITHMS</span>
            <span>05 SORTING ALGORITHMS</span>
            <span>06 SESSION CHALLENGES</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-center">
            <span>AA</span>
            <small>TRACE / LEARN / COMPETE</small>
          </div>
          <span className="orbit-chip chip-a">A*</span>
          <span className="orbit-chip chip-b">BFS</span>
          <span className="orbit-chip chip-c">O(n log n)</span>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel mode-card" aria-labelledby="modes-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CHOOSE YOUR ARENA</p>
              <h2 id="modes-heading">Two ways to explore</h2>
            </div>
          </div>
          <div className="mode-grid">
            <button className="mode-tile" type="button" onClick={() => onNavigate('pathfinding')}>
              <span className="tile-index">01 / PATH</span>
              <strong>Pathfinding</strong>
              <span>Draw a map, follow the frontier, compare routes.</span>
              <i>Open arena ↗</i>
            </button>
            <button className="mode-tile" type="button" onClick={() => onNavigate('sorting')}>
              <span className="tile-index">02 / SORT</span>
              <strong>Sorting</strong>
              <span>Watch comparisons and movements across a shared array.</span>
              <i>Open arena ↗</i>
            </button>
          </div>
        </section>
        <aside className="panel session-card">
          <p className="eyebrow">YOUR SESSION</p>
          <div className="session-number">
            {score.toLocaleString()}
            <span>PTS</span>
          </div>
          <div className="session-progress">
            <div>
              <span>Challenge progress</span>
              <strong>{progress}</strong>
            </div>
            <div className="progress-track">
              <span
                style={{ width: `${(Number(progress.split('/')[0]) / CHALLENGES.length) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => onNavigate('results')}
          >
            Review results ↗
          </button>
        </aside>
      </div>
      <div className="dashboard-bottom">
        <section className="panel challenge-preview">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NEXT UP</p>
              <h2>Challenges to clear</h2>
            </div>
            <button className="text-button" type="button" onClick={() => onNavigate('challenges')}>
              View all ↗
            </button>
          </div>
          <div className="challenge-preview-list">
            {CHALLENGES.slice(0, 3).map((challenge) => (
              <button key={challenge.id} type="button" onClick={() => onChallenge(challenge)}>
                <span className="difficulty-dot" data-level={challenge.difficulty.toLowerCase()} />
                <span>
                  <strong>{challenge.title}</strong>
                  <small>
                    {challenge.category} · {challenge.difficulty}
                  </small>
                </span>
                <b>+{challenge.points}</b>
              </button>
            ))}
          </div>
        </section>
        <section className="panel recent-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h2>Session log</h2>
            </div>
          </div>
          {activity.length ? (
            <ActivityList activity={activity.slice(0, 3)} />
          ) : (
            <p className="empty-state">Your runs and cleared challenges will appear here.</p>
          )}
          <p className="metric-note">Progress and score last for this browser session.</p>
        </section>
      </div>
    </section>
  );
}

function ChallengeBoard({
  completed,
  onStart,
}: {
  completed: readonly Completion[];
  onStart: (challenge: Challenge) => void;
}) {
  return (
    <section className="arena-view" aria-labelledby="challenges-title">
      <div className="view-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-mark">04</span> CHALLENGE BOARD
          </p>
          <h1 id="challenges-title">
            Take on a challenge.
            <br />
            <span>Earn verified points.</span>
          </h1>
          <p className="lede">
            Each objective is checked against algorithm results and the challenge's original input.
          </p>
        </div>
        <div className="mode-stamp">
          <span className="stamp-icon">◎</span>
          <span>
            SESSION <strong>{completed.length} CLEARED</strong>
          </span>
        </div>
      </div>
      <div className="challenge-grid">
        {CHALLENGES.map((challenge) => {
          const done = completed.some((entry) => entry.challenge.id === challenge.id);
          return (
            <article
              className={`panel challenge-card ${done ? 'challenge-done' : ''}`}
              key={challenge.id}
            >
              <div className="challenge-top">
                <span className="eyebrow">{challenge.category.toUpperCase()}</span>
                <span className="difficulty-label" data-level={challenge.difficulty.toLowerCase()}>
                  {challenge.difficulty}
                </span>
              </div>
              <h2>{challenge.title}</h2>
              <p>{challenge.description}</p>
              <div className="challenge-concept">
                <span>CONCEPT</span>
                {challenge.concept}
              </div>
              <div className="challenge-bottom">
                <strong>
                  +{challenge.points} <small>PTS</small>
                </strong>
                <button
                  className={`button ${done ? '' : 'button-primary'}`}
                  type="button"
                  onClick={() => onStart(challenge)}
                >
                  {done ? 'Practice again' : 'Enter challenge'} ↗
                </button>
              </div>
              {done && <span className="completed-mark">✓ CLEARED</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Results({
  score,
  completed,
  activity,
  pathResult,
  pathComparison,
  sortResult,
  sortComparison,
  onNavigate,
}: {
  score: number;
  completed: readonly Completion[];
  activity: readonly Activity[];
  pathResult: PathfindingResult | undefined;
  pathComparison: readonly PathfindingResult[] | undefined;
  sortResult: SortResult | undefined;
  sortComparison: readonly SortResult[] | undefined;
  onNavigate: (view: View) => void;
}) {
  return (
    <section className="arena-view" aria-labelledby="results-title">
      <div className="view-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-mark">05</span> RESULTS & SESSION
          </p>
          <h1 id="results-title">
            Measure the run.
            <br />
            <span>Keep the insight.</span>
          </h1>
          <p className="lede">
            A transparent record of this session's verified challenge progress and algorithm runs.
          </p>
        </div>
        <div className="mode-stamp">
          <span className="stamp-icon">↗</span>
          <span>
            TOTAL <strong>{score.toLocaleString()} POINTS</strong>
          </span>
        </div>
      </div>
      <div className="results-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">COMPLETED CHALLENGES</p>
              <h2>{completed.length} verified</h2>
            </div>
            <span className="mini-badge">{score} PTS</span>
          </div>
          {completed.length ? (
            <div className="completion-list">
              {completed.map((entry) => (
                <div className="completion-row" key={entry.challenge.id}>
                  <span className="completion-icon">✓</span>
                  <div>
                    <strong>{entry.challenge.title}</strong>
                    <p>{entry.explanation}</p>
                  </div>
                  <b>+{entry.challenge.points}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No points yet. Choose a challenge and meet its verified conditions to earn points.
            </p>
          )}
          <button
            className="button button-primary"
            type="button"
            onClick={() => onNavigate('challenges')}
          >
            Browse challenges
          </button>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ALGORITHM RESULTS</p>
              <h2>Latest evidence</h2>
            </div>
          </div>
          {pathComparison?.length === 2 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Path</th>
                    <th>Visited</th>
                    <th>Compute</th>
                  </tr>
                </thead>
                <tbody>
                  {pathComparison.map((run) => (
                    <tr key={run.algorithm}>
                      <th>{run.algorithm.toUpperCase()}</th>
                      <td>{run.pathLength ?? 'No route'}</td>
                      <td>{run.nodesVisited}</td>
                      <td>{run.computeMs.toFixed(3)} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : sortComparison?.length === 2 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Comparisons</th>
                    <th>Writes</th>
                    <th>Compute</th>
                  </tr>
                </thead>
                <tbody>
                  {sortComparison.map((run) => (
                    <tr key={run.algorithm}>
                      <th>{run.algorithm}</th>
                      <td>{run.metrics.comparisons}</td>
                      <td>{run.metrics.writes}</td>
                      <td>{run.metrics.computeMs.toFixed(3)} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : pathResult ? (
            <p className="empty-state">
              Latest: {pathResult.algorithm.toUpperCase()} ·{' '}
              {pathResult.found
                ? `${pathResult.pathLength} steps, ${pathResult.nodesVisited} nodes visited`
                : 'no route found'}{' '}
              · {pathResult.computeMs.toFixed(3)} ms compute.
            </p>
          ) : sortResult ? (
            <p className="empty-state">
              Latest: {sortResult.algorithm} · {sortResult.metrics.comparisons} comparisons,{' '}
              {sortResult.metrics.writes} writes · {sortResult.metrics.computeMs.toFixed(3)} ms
              compute.
            </p>
          ) : (
            <p className="empty-state">Run an algorithm to see its measurements here.</p>
          )}
        </article>
      </div>
      <article className="panel session-log">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">RECENT ACTIVITY</p>
            <h2>Run history</h2>
          </div>
        </div>
        {activity.length ? (
          <ActivityList activity={activity} />
        ) : (
          <p className="empty-state">The session history is empty.</p>
        )}
      </article>
    </section>
  );
}
function ActivityList({ activity }: { activity: readonly Activity[] }) {
  return (
    <ul className="activity-list">
      {activity.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <span className="activity-pip" />
          <span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
