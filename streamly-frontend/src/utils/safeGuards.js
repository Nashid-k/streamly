/**
 * safeGuards.js — Defensive utility functions to prevent runtime crashes
 *
 * These wrappers handle null/undefined/non-array inputs gracefully,
 * preventing "Cannot read properties of undefined (reading 'filter')" errors.
 */

/**
 * Safe filter — never crashes on null/undefined input
 */
export function safeFilter(arr, predicate) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(predicate);
}

/**
 * Safe map — never crashes on null/undefined input
 */
export function safeMap(arr, mapper) {
  if (!Array.isArray(arr)) return [];
  return arr.map(mapper);
}

/**
 * Safe slice — never crashes on null/undefined input
 */
export function safeSlice(arr, start, end) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(start, end);
}

/**
 * Safe find — never crashes on null/undefined input
 */
export function safeFind(arr, predicate) {
  if (!Array.isArray(arr)) return undefined;
  return arr.find(predicate);
}

/**
 * Safe some — never crashes on null/undefined input
 */
export function safeSome(arr, predicate) {
  if (!Array.isArray(arr)) return false;
  return arr.some(predicate);
}

/**
 * Safe sort — never crashes on null/undefined input
 */
export function safeSort(arr, comparator) {
  if (!Array.isArray(arr)) return [];
  return [...arr].sort(comparator);
}

/**
 * Safe spread — ensures result is always an array
 */
export function toArray(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val[Symbol.iterator] === 'function') return [...val];
  return [];
}
