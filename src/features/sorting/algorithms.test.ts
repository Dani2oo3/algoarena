import { describe, expect, it } from 'vitest';
import { createArray, isSorted, sortWithTrace } from './algorithms';
import type { SortAlgorithmId } from './types';

const algorithms: SortAlgorithmId[] = ['bubble', 'insertion', 'merge', 'quick', 'heap'];
const cases: number[][] = [
  [],
  [7],
  [5, -1, 3, 3, 0, -8],
  [-4, -4, 0, 12, 2],
  [1, 2, 3, 4, 5],
  [6, 5, 4, 3, 2, 1],
];

for (const algorithm of algorithms) {
  describe(algorithm, () => {
    for (const input of cases) {
      it(`sorts [${input.join(', ')}] without mutating its input`, () => {
        const original = [...input];
        const result = sortWithTrace(input, algorithm);
        expect(result.sorted).toEqual([...input].sort((a, b) => a - b));
        expect(isSorted(result.sorted)).toBe(true);
        expect(input).toEqual(original);
        expect(result.initial).toEqual(original);
      });
    }
    it('reports trace events and internally consistent operation counts', () => {
      const result = sortWithTrace([4, 2, 2, -1, 8], algorithm);
      expect(result.metrics.comparisons).toBe(
        result.events.filter((event) => event.type === 'compare').length,
      );
      expect(result.metrics.swaps).toBe(
        result.events.filter((event) => event.type === 'swap').length,
      );
      expect(result.metrics.writes).toBeGreaterThanOrEqual(result.metrics.swaps * 2);
      expect(result.events.at(-1)?.type).toBe('complete');
      expect(result.metrics.computeMs).toBeGreaterThanOrEqual(0);
    });
  });
}

describe('array generation', () => {
  it('is reproducible with a seed and supports ordered patterns', () => {
    expect(createArray('random', 12, 42)).toEqual(createArray('random', 12, 42));
    expect(createArray('sorted', 5, 0)).toEqual([1, 2, 3, 4, 5]);
    expect(createArray('reversed', 4, 0)).toEqual([4, 3, 2, 1]);
    expect(createArray('duplicates', 20, 8).every((value) => value >= 1 && value <= 9)).toBe(true);
  });
});
