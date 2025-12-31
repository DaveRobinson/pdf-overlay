import { describe, it, expect, beforeAll } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { createProcessingPlan } from '../src/process-document'
import type { DocumentRules } from '../src/types'

/**
 * Unit tests for plan generation logic - no file I/O required
 * These tests use in-memory PDFs only
 */
describe('createProcessingPlan', () => {
  let pdfDoc: PDFDocument

  beforeAll(async () => {
    // Create a simple 5-page PDF in memory for testing
    pdfDoc = await PDFDocument.create()
    for (let i = 0; i < 5; i++) {
      pdfDoc.addPage()
    }
  })

  describe('font embedding', () => {
    it('should embed standard fonts', async () => {
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            body: { type: 'standard', name: StandardFonts.Helvetica },
            bold: { type: 'standard', name: StandardFonts.HelveticaBold },
          },
        },
        processingRules: [],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.embeddedFonts.size).toBe(2)
      expect(plan.embeddedFonts.has('body')).toBe(true)
      expect(plan.embeddedFonts.has('bold')).toBe(true)
      expect(plan.embeddedFonts.get('body')).toBeDefined()
      expect(plan.embeddedFonts.get('bold')).toBeDefined()
    })

    it('should handle no fonts defined', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.embeddedFonts.size).toBe(0)
    })

    it('should embed multiple different font types', async () => {
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            helvetica: { type: 'standard', name: StandardFonts.Helvetica },
            courier: { type: 'standard', name: StandardFonts.Courier },
            times: { type: 'standard', name: StandardFonts.TimesRoman },
          },
        },
        processingRules: [],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.embeddedFonts.size).toBe(3)
      expect(plan.embeddedFonts.has('helvetica')).toBe(true)
      expect(plan.embeddedFonts.has('courier')).toBe(true)
      expect(plan.embeddedFonts.has('times')).toBe(true)
    })
  })

  describe('default values', () => {
    it('should extract default values', async () => {
      const rules: DocumentRules = {
        documentMeta: {
          defaults: {
            fontName: 'body',
            fontSize: 12,
            colour: '#000000',
            lineHeight: 14,
          },
        },
        processingRules: [],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.defaults).toEqual({
        fontName: 'body',
        fontSize: 12,
        colour: '#000000',
        lineHeight: 14,
      })
    })

    it('should use empty defaults when not specified', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.defaults).toEqual({})
    })

    it('should handle partial defaults', async () => {
      const rules: DocumentRules = {
        documentMeta: {
          defaults: {
            fontSize: 16,
          },
        },
        processingRules: [],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.defaults).toEqual({
        fontSize: 16,
      })
    })
  })

  describe('page rules grouping', () => {
    it('should group rules by page index', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [
          {
            type: 'text',
            position: { x: 0, y: 0 },
            element: { content: 'Page 1' },
            page: { type: 'first' },
          },
          {
            type: 'text',
            position: { x: 0, y: 0 },
            element: { content: 'Page 3' },
            page: { type: 'specific', pages: [3] },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.pageRules.size).toBe(2)
      expect(plan.pageRules.get(0)).toHaveLength(1) // Page 1 (index 0)
      expect(plan.pageRules.get(2)).toHaveLength(1) // Page 3 (index 2)
      expect(plan.pageRules.get(0)?.[0].element.content).toBe('Page 1')
      expect(plan.pageRules.get(2)?.[0].element.content).toBe('Page 3')
    })

    it('should handle multiple rules on same page', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [
          {
            type: 'text',
            position: { x: 0, y: 0 },
            element: { content: 'First' },
            page: { type: 'first' },
          },
          {
            type: 'text',
            position: { x: 100, y: 100 },
            element: { content: 'Second' },
            page: { type: 'first' },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.pageRules.size).toBe(1)
      expect(plan.pageRules.get(0)).toHaveLength(2)
      expect(plan.pageRules.get(0)?.[0].element.content).toBe('First')
      expect(plan.pageRules.get(0)?.[1].element.content).toBe('Second')
    })

    it('should handle rules applied to all pages', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [
          {
            type: 'text',
            position: { x: 0, y: 0 },
            element: { content: 'Header' },
            page: { type: 'all' },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      // Should appear on all 5 pages (indices 0-4)
      expect(plan.pageRules.size).toBe(5)
      for (let i = 0; i < 5; i++) {
        expect(plan.pageRules.get(i)).toHaveLength(1)
        expect(plan.pageRules.get(i)?.[0].element.content).toBe('Header')
      }
    })

    it('should handle page ranges', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [
          {
            type: 'text',
            position: { x: 0, y: 0 },
            element: { content: 'Middle pages' },
            page: { type: 'range', from: 2, to: 4 },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.pageRules.size).toBe(3)
      expect(plan.pageRules.get(1)).toHaveLength(1) // Page 2 (index 1)
      expect(plan.pageRules.get(2)).toHaveLength(1) // Page 3 (index 2)
      expect(plan.pageRules.get(3)).toHaveLength(1) // Page 4 (index 3)
      expect(plan.pageRules.get(0)).toBeUndefined()
      expect(plan.pageRules.get(4)).toBeUndefined()
    })

    it('should handle negative page indices', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [
          {
            type: 'text',
            position: { x: 0, y: 0 },
            element: { content: 'Last page' },
            page: { type: 'specific', pages: [-1] },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.pageRules.size).toBe(1)
      expect(plan.pageRules.get(4)).toHaveLength(1) // Last page (index 4)
      expect(plan.pageRules.get(4)?.[0].element.content).toBe('Last page')
    })

    it('should handle complex multi-page scenarios', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [
          {
            type: 'text',
            position: { x: 0, y: 0 },
            element: { content: 'Header' },
            page: { type: 'all' },
          },
          {
            type: 'text',
            position: { x: 0, y: 100 },
            element: { content: 'Footer' },
            page: { type: 'all' },
          },
          {
            type: 'text',
            position: { x: 100, y: 100 },
            element: { content: 'Cover page only' },
            page: { type: 'first' },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      // All pages should have header and footer
      expect(plan.pageRules.size).toBe(5)
      for (let i = 0; i < 5; i++) {
        if (i === 0) {
          expect(plan.pageRules.get(i)).toHaveLength(3) // Header, footer, cover text
        } else {
          expect(plan.pageRules.get(i)).toHaveLength(2) // Header, footer only
        }
      }
    })
  })

  describe('alignment defaults and cascading', () => {
    it('should extract alignment defaults', async () => {
      const rules: DocumentRules = {
        documentMeta: {
          defaults: {
            align: 'center',
            verticalAlign: 'middle',
          },
        },
        processingRules: [],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.defaults).toEqual({
        align: 'center',
        verticalAlign: 'middle',
      })
    })

    it('should include alignment with other defaults', async () => {
      const rules: DocumentRules = {
        documentMeta: {
          defaults: {
            fontName: 'body',
            fontSize: 12,
            colour: '#000000',
            lineHeight: 14,
            align: 'right',
            verticalAlign: 'bottom',
          },
        },
        processingRules: [],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.defaults).toEqual({
        fontName: 'body',
        fontSize: 12,
        colour: '#000000',
        lineHeight: 14,
        align: 'right',
        verticalAlign: 'bottom',
      })
    })

    it('should preserve element-specific alignment properties', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [
          {
            type: 'text',
            position: { x: 100, y: 200 },
            element: {
              content: 'Aligned text',
              align: 'center',
              verticalAlign: 'middle',
            },
            page: { type: 'first' },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      const rule = plan.pageRules.get(0)?.[0]
      expect(rule?.type).toBe('text')
      if (rule?.type === 'text') {
        expect(rule.element.align).toBe('center')
        expect(rule.element.verticalAlign).toBe('middle')
      }
    })

    it('should preserve bounds property on elements', async () => {
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [
          {
            type: 'text',
            position: { x: 50, y: 50 },
            element: {
              content: 'Bounded text',
              bounds: { width: 200, height: 100 },
            },
            page: { type: 'first' },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      const rule = plan.pageRules.get(0)?.[0]
      expect(rule?.type).toBe('text')
      if (rule?.type === 'text') {
        expect(rule.element.bounds).toEqual({ width: 200, height: 100 })
      }
    })

    it('should handle all alignment properties together', async () => {
      const rules: DocumentRules = {
        documentMeta: {
          defaults: {
            align: 'left',
            verticalAlign: 'top',
          },
        },
        processingRules: [
          {
            type: 'text',
            position: { x: 100, y: 200 },
            element: {
              content: 'Fully aligned',
              align: 'right',
              verticalAlign: 'bottom',
              bounds: { width: 300, height: 150 },
            },
            page: { type: 'first' },
          },
        ],
      }

      const plan = await createProcessingPlan(pdfDoc, rules)

      expect(plan.defaults.align).toBe('left')
      expect(plan.defaults.verticalAlign).toBe('top')

      const rule = plan.pageRules.get(0)?.[0]
      expect(rule?.type).toBe('text')
      if (rule?.type === 'text') {
        expect(rule.element.align).toBe('right')
        expect(rule.element.verticalAlign).toBe('bottom')
        expect(rule.element.bounds).toEqual({ width: 300, height: 150 })
      }
    })
  })
})
