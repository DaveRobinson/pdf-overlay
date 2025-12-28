import { describe, it, expect } from 'vitest'
import { normalizePageNumber, resolvePageNumbers } from '../src/page-utils'

describe('normalizePageNumber', () => {
  describe('positive page numbers', () => {
    it('should return positive numbers unchanged', () => {
      expect(normalizePageNumber(1, 10)).toBe(1)
      expect(normalizePageNumber(5, 10)).toBe(5)
      expect(normalizePageNumber(10, 10)).toBe(10)
    })
  })

  describe('negative page numbers', () => {
    it('should convert -1 to last page', () => {
      expect(normalizePageNumber(-1, 10)).toBe(10)
      expect(normalizePageNumber(-1, 5)).toBe(5)
      expect(normalizePageNumber(-1, 1)).toBe(1)
    })

    it('should convert -2 to second-to-last page', () => {
      expect(normalizePageNumber(-2, 10)).toBe(9)
      expect(normalizePageNumber(-2, 5)).toBe(4)
    })

    it('should handle multiple negative indices', () => {
      expect(normalizePageNumber(-3, 10)).toBe(8)
      expect(normalizePageNumber(-5, 10)).toBe(6)
      expect(normalizePageNumber(-10, 10)).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('should handle single page document', () => {
      expect(normalizePageNumber(1, 1)).toBe(1)
      expect(normalizePageNumber(-1, 1)).toBe(1)
    })

    it('should handle zero (though not typical usage)', () => {
      expect(normalizePageNumber(0, 10)).toBe(0)
    })
  })
})

describe('resolvePageNumbers', () => {
  describe('all pages', () => {
    it('should return all pages for a document', () => {
      expect(resolvePageNumbers({ type: 'all' }, 5)).toEqual([1, 2, 3, 4, 5])
    })

    it('should handle single page document', () => {
      expect(resolvePageNumbers({ type: 'all' }, 1)).toEqual([1])
    })

    it('should handle large documents', () => {
      const result = resolvePageNumbers({ type: 'all' }, 100)
      expect(result).toHaveLength(100)
      expect(result[0]).toBe(1)
      expect(result[99]).toBe(100)
    })
  })

  describe('specific pages', () => {
    it('should return specified pages', () => {
      expect(resolvePageNumbers({ type: 'specific', pages: [1, 3, 5] }, 10)).toEqual([1, 3, 5])
    })

    it('should handle single page', () => {
      expect(resolvePageNumbers({ type: 'specific', pages: [7] }, 10)).toEqual([7])
    })

    it('should handle negative indices in specific pages', () => {
      expect(resolvePageNumbers({ type: 'specific', pages: [-1, -2] }, 10)).toEqual([10, 9])
    })

    it('should handle mixed positive and negative indices', () => {
      expect(resolvePageNumbers({ type: 'specific', pages: [1, -1] }, 10)).toEqual([1, 10])
    })

    it('should preserve order of specified pages', () => {
      expect(resolvePageNumbers({ type: 'specific', pages: [5, 3, 1] }, 10)).toEqual([5, 3, 1])
    })

    it('should allow duplicate pages', () => {
      expect(resolvePageNumbers({ type: 'specific', pages: [2, 2, 2] }, 10)).toEqual([2, 2, 2])
    })
  })

  describe('first page', () => {
    it('should return first page', () => {
      expect(resolvePageNumbers({ type: 'first' }, 10)).toEqual([1])
      expect(resolvePageNumbers({ type: 'first' }, 1)).toEqual([1])
      expect(resolvePageNumbers({ type: 'first' }, 100)).toEqual([1])
    })
  })

  describe('last page', () => {
    it('should return last page', () => {
      expect(resolvePageNumbers({ type: 'last' }, 10)).toEqual([10])
      expect(resolvePageNumbers({ type: 'last' }, 1)).toEqual([1])
      expect(resolvePageNumbers({ type: 'last' }, 100)).toEqual([100])
    })
  })

  describe('range pages', () => {
    it('should return pages in range', () => {
      expect(resolvePageNumbers({ type: 'range', from: 3, to: 6 }, 10)).toEqual([3, 4, 5, 6])
    })

    it('should handle single page range', () => {
      expect(resolvePageNumbers({ type: 'range', from: 5, to: 5 }, 10)).toEqual([5])
    })

    it('should handle range from first to last', () => {
      expect(resolvePageNumbers({ type: 'range', from: 1, to: 5 }, 5)).toEqual([1, 2, 3, 4, 5])
    })

    it('should handle negative indices in range', () => {
      expect(resolvePageNumbers({ type: 'range', from: -3, to: -1 }, 10)).toEqual([8, 9, 10])
    })

    it('should handle mixed positive and negative in range', () => {
      expect(resolvePageNumbers({ type: 'range', from: 1, to: -8 }, 10)).toEqual([1, 2, 3])
    })

    it('should handle range starting from negative', () => {
      expect(resolvePageNumbers({ type: 'range', from: -5, to: -3 }, 10)).toEqual([6, 7, 8])
    })

    it('should handle full document range with negative', () => {
      expect(resolvePageNumbers({ type: 'range', from: 1, to: -1 }, 5)).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('complex scenarios', () => {
    it('should handle typical "last 3 pages" use case', () => {
      expect(resolvePageNumbers({ type: 'range', from: -3, to: -1 }, 10)).toEqual([8, 9, 10])
    })

    it('should handle "all except first and last" use case', () => {
      expect(resolvePageNumbers({ type: 'range', from: 2, to: -2 }, 10)).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('should handle "first 3 pages" use case', () => {
      expect(resolvePageNumbers({ type: 'range', from: 1, to: 3 }, 10)).toEqual([1, 2, 3])
    })
  })
})
