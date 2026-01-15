import { processDocumentFile } from '../src/process-document'
import type { DocumentRules } from '../src/types'

/**
 * Demonstrates all PageSelector types for controlling which pages receive content.
 *
 * PageSelector options:
 * - { type: 'all' }                    - All pages
 * - { type: 'first' }                  - First page only
 * - { type: 'last' }                   - Last page only
 * - { type: 'specific', pages: [...] } - Specific page numbers (1-based, supports negative)
 * - { type: 'range', from: N, to: M }  - Page range (inclusive)
 *
 * Negative page numbers: -1 = last page, -2 = second-to-last, etc.
 */
async function testPagination() {
  console.log('Testing pagination features...')

  const rules: DocumentRules = {
    documentMeta: {
      fonts: {
        body: { type: 'standard', family: 'Helvetica' },
        bold: { type: 'standard', family: 'Helvetica-Bold' },
      },
      defaults: {
        fontName: 'body',
        fontSize: 10,
        colour: '#000000',
      },
    },
    processingRules: [
      // ============================================
      // type: 'all' - Content on every page
      // ============================================
      {
        type: 'text',
        label: 'Header on all pages',
        position: { x: 50, y: 800 },
        element: {
          content: 'HEADER: This text appears on ALL pages',
          fontName: 'bold',
          colour: '#0066CC',
        },
        page: { type: 'all' },
      },
      {
        type: 'text',
        label: 'Footer on all pages',
        position: { x: 50, y: 70 },
        element: {
          content: 'FOOTER: This text appears on ALL pages',
          fontName: 'bold',
          colour: '#0066CC',
        },
        page: { type: 'all' },
      },

      // ============================================
      // type: 'first' - First page only
      // ============================================
      {
        type: 'text',
        label: 'First page only',
        position: { x: 55, y: 725 },
        element: {
          content: 'FIRST PAGE ONLY',
          fontName: 'bold',
          fontSize: 12,
          colour: '#009900',
        },
        page: { type: 'first' },
      },

      // ============================================
      // type: 'last' - Last page only
      // ============================================
      {
        type: 'text',
        label: 'Last page only',
        position: { x: 350, y: 725 },
        element: {
          content: 'LAST PAGE ONLY',
          fontName: 'bold',
          fontSize: 12,
          colour: '#CC0000',
        },
        page: { type: 'last' },
      },

      // ============================================
      // type: 'specific' - Specific pages [2, 4, 6]
      // ============================================
      {
        type: 'text',
        label: 'Specific pages 2, 4, 6',
        position: { x: 55, y: 665 },
        element: {
          content: 'SPECIFIC: This appears on pages 2, 4, and 6 only',
          fontName: 'bold',
          fontSize: 11,
          colour: '#9900CC',
        },
        page: { type: 'specific', pages: [2, 4, 6] },
      },

      // ============================================
      // type: 'range' - Pages 2 through 4
      // ============================================
      {
        type: 'text',
        label: 'Range pages 2-4',
        position: { x: 55, y: 605 },
        element: {
          content: 'RANGE: This appears on pages 2, 3, and 4 (from: 2, to: 4)',
          fontName: 'bold',
          fontSize: 11,
          colour: '#CC6600',
        },
        page: { type: 'range', from: 2, to: 4 },
      },

      // ============================================
      // type: 'specific' with negative indices
      // -1 = last page, -2 = second-to-last
      // ============================================
      {
        type: 'text',
        label: 'Negative index pages',
        position: { x: 55, y: 545 },
        element: {
          content: 'NEGATIVE INDEX: This appears on last two pages [-1, -2]',
          fontName: 'bold',
          fontSize: 11,
          colour: '#006666',
        },
        page: { type: 'specific', pages: [-1, -2] },
      },
    ],
  }

  await processDocumentFile(
    'samples/base/pagination-demo.pdf',
    rules,
    'samples/output/pagination.pdf'
  )

  console.log('✓ Output: samples/output/pagination.pdf')
  console.log('')
  console.log('Expected results:')
  console.log('  - Pages 1-6: Blue header and footer (type: "all")')
  console.log('  - Page 1 only: Green "FIRST PAGE ONLY" (type: "first")')
  console.log('  - Page 6 only: Red "LAST PAGE ONLY" (type: "last")')
  console.log('  - Pages 2, 4, 6: Purple "SPECIFIC" text (type: "specific")')
  console.log('  - Pages 2, 3, 4: Orange "RANGE" text (type: "range")')
  console.log('  - Pages 5, 6: Teal "NEGATIVE INDEX" text (pages: [-1, -2])')
}

testPagination().catch(console.error)
