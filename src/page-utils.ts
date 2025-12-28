import type { PageSelector } from './types'

/**
 * Normalize a page number, converting negative numbers to count from the end
 * @param pageNum - Page number (1-based or negative)
 * @param pageCount - Total number of pages
 * @returns Normalized page number (1-based)
 */
export function normalizePageNumber(pageNum: number, pageCount: number): number {
  if (pageNum < 0) {
    return pageCount + pageNum + 1
  }
  return pageNum
}

/**
 * Resolve a PageSelector to actual page numbers
 * Supports negative numbers to count backwards from the end (e.g., -1 = last page, -2 = second-to-last)
 * @returns Array of page numbers (1-based)
 */
export function resolvePageNumbers(selector: PageSelector, pageCount: number): number[] {
  switch (selector.type) {
    case 'all':
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    case 'specific':
      return selector.pages.map(p => normalizePageNumber(p, pageCount))
    case 'first':
      return [1]
    case 'last':
      return [pageCount]
    case 'range': {
      const from = normalizePageNumber(selector.from, pageCount)
      const to = normalizePageNumber(selector.to, pageCount)
      return Array.from(
        { length: to - from + 1 },
        (_, i) => from + i
      )
    }
  }
}
