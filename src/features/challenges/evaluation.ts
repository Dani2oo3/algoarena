import { solvePathfinding } from '../pathfinding/algorithms';
import { pathMapSignature, type PathfindingResult } from '../pathfinding/types';
import { isSorted } from '../sorting/algorithms';
import type { SortResult } from '../sorting/types';
import type { Challenge } from './catalog';

export interface ChallengeEvidence {
  readonly pathResult?: PathfindingResult;
  readonly pathComparison?: readonly PathfindingResult[];
  readonly sortResult?: SortResult;
  readonly sortComparison?: readonly SortResult[];
}
export interface ChallengeEvaluation {
  readonly success: boolean;
  readonly explanation: string;
}

function preservesValues(result: SortResult): boolean {
  if (!isSorted(result.sorted) || result.sorted.length !== result.initial.length) return false;
  const counts = new Map<number, number>();
  for (const value of result.initial) counts.set(value, (counts.get(value) ?? 0) + 1);
  for (const value of result.sorted) {
    const count = counts.get(value) ?? 0;
    if (count === 0) return false;
    counts.set(value, count - 1);
  }
  return [...counts.values()].every((count) => count === 0);
}

export function evaluateChallenge(
  challenge: Challenge,
  evidence: ChallengeEvidence,
): ChallengeEvaluation {
  if (challenge.objective === 'shortest-path') {
    if (!challenge.pathMap || !evidence.pathResult?.found)
      return { success: false, explanation: 'Run an algorithm that finds a route first.' };
    if (evidence.pathResult.mapSignature !== pathMapSignature(challenge.pathMap))
      return {
        success: false,
        explanation: 'Restore the challenge map before submitting this run.',
      };
    const shortest = solvePathfinding(challenge.pathMap, 'bfs').pathLength;
    const algorithmAllowed =
      challenge.requiredAlgorithms?.includes(evidence.pathResult.algorithm) ?? true;
    const success = algorithmAllowed && evidence.pathResult.pathLength === shortest;
    return {
      success,
      explanation: success
        ? `Verified: ${evidence.pathResult.algorithm.toUpperCase()} found a minimum ${shortest}-step route.`
        : 'The route was not a shortest path. Try BFS, Dijkstra, or A*.',
    };
  }
  if (challenge.objective === 'no-route') {
    const success =
      evidence.pathResult !== undefined &&
      challenge.pathMap !== undefined &&
      evidence.pathResult.mapSignature === pathMapSignature(challenge.pathMap) &&
      !evidence.pathResult.found;
    return {
      success,
      explanation: success
        ? 'Verified: the search exhausted its frontier without reaching the goal.'
        : 'Run a search and confirm that no route can be reached.',
    };
  }
  if (challenge.objective === 'path-comparison') {
    const runs = evidence.pathComparison ?? [];
    const bfs = runs.find((run) => run.algorithm === 'bfs');
    const dfs = runs.find((run) => run.algorithm === 'dfs');
    const sameChallengeMap = runs.every(
      (run) => run.mapSignature === pathMapSignature(challenge.pathMap!),
    );
    const success = Boolean(
      sameChallengeMap &&
      bfs?.found &&
      dfs?.found &&
      bfs.pathLength !== null &&
      dfs.pathLength !== null &&
      bfs.pathLength <= dfs.pathLength,
    );
    return {
      success,
      explanation: success
        ? `Verified: BFS used ${bfs!.pathLength} steps and DFS used ${dfs!.pathLength}.`
        : 'Compare BFS and DFS on the same map to see their route lengths.',
    };
  }
  if (challenge.objective === 'sort-correctly') {
    const expected = challenge.array ?? [];
    const success =
      evidence.sortResult !== undefined &&
      evidence.sortResult.initial.length === expected.length &&
      evidence.sortResult.initial.every((value, index) => value === expected[index]) &&
      preservesValues(evidence.sortResult);
    return {
      success,
      explanation: success
        ? 'Verified: the output is ordered and preserves the input values.'
        : 'Run a sorting algorithm and check that every input value is preserved.',
    };
  }
  const runs = evidence.sortComparison ?? [];
  const merge = runs.find((run) => run.algorithm === 'merge');
  const quick = runs.find((run) => run.algorithm === 'quick');
  const expected = challenge.array ?? [];
  const sameInput = (run: SortResult): boolean =>
    run.initial.length === expected.length &&
    run.initial.every((value, index) => value === expected[index]);
  const success = Boolean(
    merge &&
    quick &&
    sameInput(merge) &&
    sameInput(quick) &&
    preservesValues(merge) &&
    preservesValues(quick) &&
    merge.sorted.every((value, index) => value === quick.sorted[index]),
  );
  return {
    success,
    explanation: success
      ? 'Verified: Merge Sort and Quick Sort produced the same sorted values from the shared input.'
      : 'Compare Merge Sort and Quick Sort using the same initial array.',
  };
}
