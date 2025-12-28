import { processDocument } from '../src/process-document'
import type { DocumentRules } from '../src/types'

async function testTextStyling() {
  console.log('Testing text styling features...')

  const rules: DocumentRules = {
    documentMeta: {
      fonts: {
        body: { type: 'standard', name: 'Helvetica' },
        bold: { type: 'standard', name: 'Helvetica-Bold' },
        mono: { type: 'standard', name: 'Courier' },
      },
      defaults: {
        fontName: 'body',
        fontSize: 12,
        colour: '#000000',
      },
    },
    processingRules: [
      // Test 1: Default styling
      {
        type: 'text',
        position: { x: 50, y: 750 },
        element: {
          content: 'Test 1: Default styling (Helvetica 12pt black)',
        },
        page: { type: 'first' },
      },

      // Test 2: Font override
      {
        type: 'text',
        position: { x: 50, y: 720 },
        element: {
          content: 'Test 2: Bold font override',
          fontName: 'bold',
        },
        page: { type: 'first' },
      },

      // Test 3: Hex colour (shorthand)
      {
        type: 'text',
        position: { x: 50, y: 690 },
        element: {
          content: 'Test 3: Hex colour shorthand (#F00 = red)',
          colour: '#F00',
        },
        page: { type: 'first' },
      },

      // Test 4: Hex colour (full)
      {
        type: 'text',
        position: { x: 50, y: 660 },
        element: {
          content: 'Test 4: Hex colour full (#0000FF = blue)',
          colour: '#0000FF',
        },
        page: { type: 'first' },
      },

      // Test 5: RGB colour object
      {
        type: 'text',
        position: { x: 50, y: 630 },
        element: {
          content: 'Test 5: RGB object (green)',
          colour: { type: 'rgb', r: 0, g: 1, b: 0 },
        },
        page: { type: 'first' },
      },

      // Test 6: Grey colour
      {
        type: 'text',
        position: { x: 50, y: 600 },
        element: {
          content: 'Test 6: Grey colour (0.5 = medium grey)',
          colour: { type: 'grey', grey: 0.5 },
        },
        page: { type: 'first' },
      },

      // Test 7: Font size override
      {
        type: 'text',
        position: { x: 50, y: 560 },
        element: {
          content: 'Test 7: Large font size (24pt)',
          fontSize: 24,
        },
        page: { type: 'first' },
      },

      // Test 8: Multiple overrides
      {
        type: 'text',
        position: { x: 50, y: 520 },
        element: {
          content: 'Test 8: Bold + large + purple',
          fontName: 'bold',
          fontSize: 18,
          colour: '#9900FF',
        },
        page: { type: 'first' },
      },

      // Test 9: Opacity
      {
        type: 'text',
        position: { x: 50, y: 490 },
        element: {
          content: 'Test 9: Opacity 0.5 (semi-transparent)',
          opacity: 0.5,
        },
        page: { type: 'first' },
      },

      // Test 10: Line height with multiline text
      {
        type: 'text',
        position: { x: 50, y: 450 },
        element: {
          content: 'Test 10: Line height 20\nSecond line\nThird line',
          lineHeight: 20,
        },
        page: { type: 'first' },
      },

      // Test 11: Monospace font
      {
        type: 'text',
        position: { x: 50, y: 360 },
        element: {
          content: 'Test 11: Monospace font (Courier)\ncode = "example"',
          fontName: 'mono',
          fontSize: 10,
        },
        page: { type: 'first' },
      },

      // Test 12: CMYK colour (for print)
      {
        type: 'text',
        position: { x: 50, y: 320 },
        element: {
          content: 'Test 12: CMYK colour (cyan)',
          colour: { type: 'cmyk', c: 1, m: 0, y: 0, k: 0 },
        },
        page: { type: 'first' },
      },
    ],
  }

  const outputPath = await processDocument('sample.pdf', rules, 'test-output-text-styling.pdf')
  console.log(`✓ Test PDF created: ${outputPath}`)
  console.log('Open the PDF to visually verify all text styling features')
}

testTextStyling().catch(console.error)
