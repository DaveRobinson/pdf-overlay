import { processDocument } from '../src/process-document'
import type { DocumentRules } from '../src/types'

async function testTextAlignment() {
  console.log('Testing text alignment features...')

  const rules: DocumentRules = {
    documentMeta: {
      fonts: {
        body: { type: 'standard', name: 'Helvetica' },
        bold: { type: 'standard', name: 'Helvetica-Bold' },
      },
      defaults: {
        fontName: 'body',
        fontSize: 10,
        colour: '#000000',
      },
    },
    processingRules: [
      // Title
      {
        type: 'text',
        position: { x: 300, y: 770 },
        element: {
          content: 'Text Alignment & Bounds Demo',
          fontName: 'bold',
          fontSize: 18,
          align: 'center',
        },
        page: { type: 'first' },
      },

      // Section 1: Horizontal Alignment (without bounds)
      {
        type: 'text',
        position: { x: 50, y: 730 },
        element: {
          content: 'Section 1: Horizontal Alignment (marker at x=300)',
          fontName: 'bold',
          fontSize: 12,
        },
        page: { type: 'first' },
      },

      // Left aligned (default)
      {
        type: 'text',
        position: { x: 300, y: 710 },
        element: {
          content: 'Left aligned (default)',
          align: 'left',
        },
        page: { type: 'first' },
      },

      // Center aligned
      {
        type: 'text',
        position: { x: 300, y: 695 },
        element: {
          content: 'Center aligned',
          align: 'center',
        },
        page: { type: 'first' },
      },

      // Right aligned
      {
        type: 'text',
        position: { x: 300, y: 680 },
        element: {
          content: 'Right aligned',
          align: 'right',
        },
        page: { type: 'first' },
      },

      // Section 2: Horizontal Alignment with Bounds
      {
        type: 'text',
        position: { x: 50, y: 650 },
        element: {
          content: 'Section 2: Alignment within Bounds (200pt wide box at x=200)',
          fontName: 'bold',
          fontSize: 12,
        },
        page: { type: 'first' },
      },

      // Left in bounds
      {
        type: 'text',
        position: { x: 200, y: 630 },
        element: {
          content: 'Left in bounds',
          align: 'left',
          bounds: { width: 200 },
        },
        page: { type: 'first' },
      },

      // Center in bounds
      {
        type: 'text',
        position: { x: 200, y: 615 },
        element: {
          content: 'Center in bounds',
          align: 'center',
          bounds: { width: 200 },
        },
        page: { type: 'first' },
      },

      // Right in bounds
      {
        type: 'text',
        position: { x: 200, y: 600 },
        element: {
          content: 'Right in bounds',
          align: 'right',
          bounds: { width: 200 },
        },
        page: { type: 'first' },
      },

      // Section 3: Vertical Alignment
      {
        type: 'text',
        position: { x: 50, y: 570 },
        element: {
          content: 'Section 3: Vertical Alignment (marker at y=500)',
          fontName: 'bold',
          fontSize: 12,
        },
        page: { type: 'first' },
      },

      // Top aligned
      {
        type: 'text',
        position: { x: 100, y: 500 },
        element: {
          content: 'Top',
          verticalAlign: 'top',
        },
        page: { type: 'first' },
      },

      // Middle aligned
      {
        type: 'text',
        position: { x: 200, y: 500 },
        element: {
          content: 'Middle',
          verticalAlign: 'middle',
        },
        page: { type: 'first' },
      },

      // Bottom aligned
      {
        type: 'text',
        position: { x: 300, y: 500 },
        element: {
          content: 'Bottom',
          verticalAlign: 'bottom',
        },
        page: { type: 'first' },
      },

      // Section 4: Combined Alignment with Bounds
      {
        type: 'text',
        position: { x: 50, y: 450 },
        element: {
          content: 'Section 4: Combined H+V Alignment (150x80 box)',
          fontName: 'bold',
          fontSize: 12,
        },
        page: { type: 'first' },
      },

      // Top-Left
      {
        type: 'text',
        position: { x: 50, y: 410 },
        element: {
          content: 'TL',
          align: 'left',
          verticalAlign: 'top',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Top-Center
      {
        type: 'text',
        position: { x: 220, y: 410 },
        element: {
          content: 'TC',
          align: 'center',
          verticalAlign: 'top',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Top-Right
      {
        type: 'text',
        position: { x: 390, y: 410 },
        element: {
          content: 'TR',
          align: 'right',
          verticalAlign: 'top',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Middle-Left
      {
        type: 'text',
        position: { x: 50, y: 310 },
        element: {
          content: 'ML',
          align: 'left',
          verticalAlign: 'middle',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Middle-Center
      {
        type: 'text',
        position: { x: 220, y: 310 },
        element: {
          content: 'MC',
          align: 'center',
          verticalAlign: 'middle',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Middle-Right
      {
        type: 'text',
        position: { x: 390, y: 310 },
        element: {
          content: 'MR',
          align: 'right',
          verticalAlign: 'middle',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Bottom-Left
      {
        type: 'text',
        position: { x: 50, y: 210 },
        element: {
          content: 'BL',
          align: 'left',
          verticalAlign: 'bottom',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Bottom-Center
      {
        type: 'text',
        position: { x: 220, y: 210 },
        element: {
          content: 'BC',
          align: 'center',
          verticalAlign: 'bottom',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Bottom-Right
      {
        type: 'text',
        position: { x: 390, y: 210 },
        element: {
          content: 'BR',
          align: 'right',
          verticalAlign: 'bottom',
          bounds: { width: 150, height: 80 },
        },
        page: { type: 'first' },
      },

      // Section 5: Text Wrapping with Bounds
      {
        type: 'text',
        position: { x: 50, y: 150 },
        element: {
          content: 'Section 5: Text Wrapping (150pt wide box)',
          fontName: 'bold',
          fontSize: 12,
        },
        page: { type: 'first' },
      },

      // Wrapped text - left aligned
      {
        type: 'text',
        position: { x: 50, y: 130 },
        element: {
          content: 'This is a longer piece of text that will wrap within the bounds when it exceeds the specified width.',
          bounds: { width: 150 },
          align: 'left',
          lineHeight: 14,
        },
        page: { type: 'first' },
      },

      // Wrapped text - center aligned
      {
        type: 'text',
        position: { x: 220, y: 130 },
        element: {
          content: 'This is a longer piece of text that will wrap within the bounds when it exceeds the specified width.',
          bounds: { width: 150 },
          align: 'center',
          lineHeight: 14,
        },
        page: { type: 'first' },
      },

      // Wrapped text - right aligned
      {
        type: 'text',
        position: { x: 390, y: 130 },
        element: {
          content: 'This is a longer piece of text that will wrap within the bounds when it exceeds the specified width.',
          bounds: { width: 150 },
          align: 'right',
          lineHeight: 14,
        },
        page: { type: 'first' },
      },
    ],
  }

  const outputPath = await processDocument('sample.pdf', rules, 'test-output-text-alignment.pdf')
  console.log(`✓ Test PDF created: ${outputPath}`)
  console.log('Open the PDF to visually verify all text alignment features')
}

testTextAlignment().catch(console.error)
