import { describe, expect, it } from 'vitest';
import { CHALLENGES } from './catalog';
import { evaluateChallenge } from './evaluation';
import { solvePathfinding } from '../pathfinding/algorithms';
import { createDefaultPathMap } from '../pathfinding/algorithms';
import { sortWithTrace } from '../sorting/algorithms';

describe('challenge verification', () => {
  it('rejects evidence from a different map for the no-route challenge', () => {
    const challenge = CHALLENGES.find((item) => item.id === 'blocked-proof')!;
    const unrelated = solvePathfinding(createDefaultPathMap(), 'bfs');
    expect(evaluateChallenge(challenge, { pathResult: unrelated }).success).toBe(false);
    expect(
      evaluateChallenge(challenge, { pathResult: solvePathfinding(challenge.pathMap!, 'bfs') })
        .success,
    ).toBe(true);
  });

  it('requires the challenge input and a correct result before awarding sorting success', () => {
    const challenge = CHALLENGES.find((item) => item.id === 'repeat-storm')!;
    const wrongInput = sortWithTrace([3, 2, 1], 'merge');
    const valid = sortWithTrace(challenge.array!, 'merge');
    expect(evaluateChallenge(challenge, { sortResult: wrongInput }).success).toBe(false);
    expect(evaluateChallenge(challenge, { sortResult: valid }).success).toBe(true);
  });

  it('only accepts the required algorithms on the same exact map for path comparison', () => {
    const challenge = CHALLENGES.find((item) => item.id === 'frontier-duel')!;
    const bfs = solvePathfinding(challenge.pathMap!, 'bfs');
    const dfs = solvePathfinding(challenge.pathMap!, 'dfs');
    expect(evaluateChallenge(challenge, { pathComparison: [bfs, dfs] }).success).toBe(true);
    expect(
      evaluateChallenge(challenge, {
        pathComparison: [bfs, solvePathfinding(createDefaultPathMap(), 'dfs')],
      }).success,
    ).toBe(false);
  });

  it('accepts a sorting comparison only when both algorithms use the challenge source', () => {
    const challenge = CHALLENGES.find((item) => item.id === 'merge-quick-showdown')!;
    expect(
      evaluateChallenge(challenge, {
        sortComparison: [
          sortWithTrace(challenge.array!, 'merge'),
          sortWithTrace(challenge.array!, 'quick'),
        ],
      }).success,
    ).toBe(true);
    expect(
      evaluateChallenge(challenge, {
        sortComparison: [sortWithTrace(challenge.array!, 'merge'), sortWithTrace([1, 2], 'quick')],
      }).success,
    ).toBe(false);
  });
});
