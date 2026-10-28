export type SortAlgorithmId = 'bubble' | 'insertion' | 'merge' | 'quick' | 'heap';
export type SortEvent =
  | { readonly type: 'compare'; readonly indices: readonly number[] }
  | { readonly type: 'swap'; readonly left: number; readonly right: number }
  | { readonly type: 'write'; readonly index: number; readonly value: number }
  | { readonly type: 'complete'; readonly indices: readonly number[] };
export interface SortMetrics {
  readonly comparisons: number;
  readonly swaps: number;
  readonly writes: number;
  readonly computeMs: number;
}
export interface SortResult {
  readonly algorithm: SortAlgorithmId;
  readonly initial: readonly number[];
  readonly sorted: readonly number[];
  readonly events: readonly SortEvent[];
  readonly metrics: SortMetrics;
}
export type ArrayPattern = 'random' | 'sorted' | 'reversed' | 'duplicates';
