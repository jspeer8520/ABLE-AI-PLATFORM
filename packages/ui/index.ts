import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS class names.
 *
 * Combines conditional class values via `clsx` and resolves conflicting
 * Tailwind utilities via `tailwind-merge` so the last-declared class wins.
 *
 * @param inputs - Class values (strings, arrays, or conditional objects).
 * @returns A single merged, deduplicated class-name string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
