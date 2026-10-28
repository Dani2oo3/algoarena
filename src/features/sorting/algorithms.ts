import { createRandom } from '../../lib/seededRandom';
import type { ArrayPattern, SortAlgorithmId, SortEvent, SortResult } from './types';

export const SORT_ALGORITHMS: readonly {
  id: SortAlgorithmId;
  label: string;
  complexity: string;
}[] = [
  { id: 'bubble', label: 'Bubble Sort', complexity: 'O(n²)' },
  { id: 'insertion', label: 'Insertion Sort', complexity: 'O(n²)' },
  { id: 'merge', label: 'Merge Sort', complexity: 'O(n log n)' },
  { id: 'quick', label: 'Quick Sort', complexity: 'O(n²) worst' },
  { id: 'heap', label: 'Heap Sort', complexity: 'O(n log n)' },
];
interface Counters {
  comparisons: number;
  swaps: number;
  writes: number;
}

export function sortWithTrace(input: readonly number[], algorithm: SortAlgorithmId): SortResult {
  const started = performance.now();
  const values = [...input];
  const events: SortEvent[] = [];
  const counters: Counters = { comparisons: 0, swaps: 0, writes: 0 };
  const compare = (left: number, right: number, indices?: number[]): number => {
    counters.comparisons += 1;
    events.push({ type: 'compare', indices: indices ?? [left, right] });
    return left - right;
  };
  const swap = (left: number, right: number): void => {
    if (left === right) return;
    [values[left], values[right]] = [values[right]!, values[left]!];
    counters.swaps += 1;
    counters.writes += 2;
    events.push({ type: 'swap', left, right });
  };
  const write = (index: number, value: number): void => {
    values[index] = value;
    counters.writes += 1;
    events.push({ type: 'write', index, value });
  };

  if (algorithm === 'bubble') {
    for (let end = values.length - 1; end > 0; end -= 1) {
      let changed = false;
      for (let index = 0; index < end; index += 1) {
        if (compare(values[index]!, values[index + 1]!, [index, index + 1]) > 0) {
          swap(index, index + 1);
          changed = true;
        }
      }
      if (!changed) break;
    }
  } else if (algorithm === 'insertion') {
    for (let index = 1; index < values.length; index += 1) {
      const key = values[index]!;
      let cursor = index - 1;
      while (cursor >= 0) {
        counters.comparisons += 1;
        events.push({ type: 'compare', indices: [cursor, index] });
        if (values[cursor]! <= key) break;
        write(cursor + 1, values[cursor]!);
        cursor -= 1;
      }
      if (cursor + 1 !== index || values[index] !== key) write(cursor + 1, key);
    }
  } else if (algorithm === 'merge') {
    const merge = (low: number, middle: number, high: number): void => {
      const left = values.slice(low, middle + 1);
      const right = values.slice(middle + 1, high + 1);
      let leftIndex = 0;
      let rightIndex = 0;
      let target = low;
      while (leftIndex < left.length && rightIndex < right.length) {
        counters.comparisons += 1;
        events.push({ type: 'compare', indices: [low + leftIndex, middle + 1 + rightIndex] });
        if (left[leftIndex]! <= right[rightIndex]!) write(target++, left[leftIndex++]!);
        else write(target++, right[rightIndex++]!);
      }
      while (leftIndex < left.length) write(target++, left[leftIndex++]!);
      while (rightIndex < right.length) write(target++, right[rightIndex++]!);
    };
    const divide = (low: number, high: number): void => {
      if (low >= high) return;
      const middle = Math.floor((low + high) / 2);
      divide(low, middle);
      divide(middle + 1, high);
      merge(low, middle, high);
    };
    divide(0, values.length - 1);
  } else if (algorithm === 'quick') {
    const stack: [number, number][] = [[0, values.length - 1]];
    while (stack.length > 0) {
      const [low, high] = stack.pop()!;
      if (low >= high) continue;
      const pivot = values[high]!;
      let boundary = low;
      for (let index = low; index < high; index += 1) {
        counters.comparisons += 1;
        events.push({ type: 'compare', indices: [index, high] });
        if (values[index]! <= pivot) swap(boundary++, index);
      }
      swap(boundary, high);
      const left: [number, number] = [low, boundary - 1];
      const right: [number, number] = [boundary + 1, high];
      if (left[0] < left[1]) stack.push(left);
      if (right[0] < right[1]) stack.push(right);
    }
  } else {
    const siftDown = (rootIndex: number, size: number): void => {
      let root = rootIndex;
      while (root * 2 + 1 < size) {
        let child = root * 2 + 1;
        const right = child + 1;
        if (right < size) {
          counters.comparisons += 1;
          events.push({ type: 'compare', indices: [child, right] });
          if (values[right]! > values[child]!) child = right;
        }
        counters.comparisons += 1;
        events.push({ type: 'compare', indices: [root, child] });
        if (values[root]! >= values[child]!) return;
        swap(root, child);
        root = child;
      }
    };
    for (let start = Math.floor(values.length / 2) - 1; start >= 0; start -= 1)
      siftDown(start, values.length);
    for (let end = values.length - 1; end > 0; end -= 1) {
      swap(0, end);
      siftDown(0, end);
    }
  }

  events.push({ type: 'complete', indices: values.map((_, index) => index) });
  return {
    algorithm,
    initial: [...input],
    sorted: values,
    events,
    metrics: { ...counters, computeMs: Number((performance.now() - started).toFixed(3)) },
  };
}

export function createArray(pattern: ArrayPattern, size: number, seed: string | number): number[] {
  const safeSize = Math.max(1, Math.min(72, Math.floor(size)));
  if (pattern === 'sorted') return Array.from({ length: safeSize }, (_, index) => index + 1);
  if (pattern === 'reversed')
    return Array.from({ length: safeSize }, (_, index) => safeSize - index);
  const random = createRandom(seed);
  if (pattern === 'duplicates')
    return Array.from({ length: safeSize }, () => Math.floor(random() * 9) + 1);
  return Array.from({ length: safeSize }, () => Math.floor(random() * 90) + 10);
}

export function isSorted(values: readonly number[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1]! <= value);
}
