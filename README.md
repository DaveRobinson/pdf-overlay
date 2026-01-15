# PDF Overlay

This library provides a way to add content to a PDF file by applying a structured set of rules.

## Usage

### Node.js (File-based)

```typescript
import { processDocumentFile } from 'pdf-overlay'
import type { DocumentRules } from 'pdf-overlay'

const rules: DocumentRules = {
  documentMeta: {
    fonts: {
      body: { type: 'standard', family: 'Helvetica' },
    },
    defaults: {
      fontName: 'body',
      fontSize: 12,
      colour: '#000000',
    },
  },
  processingRules: [
    {
      type: 'text',
      label: 'Header on all pages',
      position: { x: 50, y: 750 },
      element: { content: 'Header on all pages' },
      page: { type: 'all' },
    },
    {
      type: 'text',
      label: 'First page footer',
      position: { x: 50, y: 100 },
      element: {
        content: 'First page only',
        colour: '#FF0000',
      },
      page: { type: 'first' },
    },
  ],
}

await processDocumentFile('input.pdf', rules, 'output.pdf')
```

### Browser (Bytes-based)

```typescript
import { processDocument } from 'pdf-overlay'

const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer())
const processedBytes = await processDocument(pdfBytes, rules)

// Display in iframe
const blob = new Blob([processedBytes], { type: 'application/pdf' })
document.getElementById('preview').src = URL.createObjectURL(blob)
```

### With Custom Fonts and Images

```typescript
import { processDocumentFile } from 'pdf-overlay'

const rules = {
  documentMeta: {
    fonts: {
      brand: { type: 'custom', family: 'My Brand Font' }
    }
  },
  processingRules: [
    {
      type: 'image',
      element: { name: 'logo' },
      position: { x: 50, y: 750 },
      page: { type: 'all' }
    }
  ]
}

await processDocumentFile('input.pdf', rules, 'output.pdf', {
  basePaths: {
    fonts: './assets/fonts',
    images: './assets/images'
  },
  resources: {
    fonts: { brand: 'BrandFont-Regular.ttf' },
    images: { logo: 'company-logo.png' }
  }
})
```

## Key Concepts

### Coordinate System

PDFs use a **bottom-left origin** coordinate system:
- Position `(0, 0)` is at the **bottom-left corner** of the page
- X increases to the right
- Y increases **upward** (not downward like typical screen coordinates)

**Example for A4 page (595 × 842 points):**
```typescript
{ x: 50, y: 792 }   // Near top-left
{ x: 50, y: 50 }    // Near bottom-left
{ x: 545, y: 792 }  // Near top-right
{ x: 545, y: 50 }   // Near bottom-right
```

### Units

All positions and dimensions are in **PDF points** where 1 point = 1/72 inch.

**Common page sizes:**
- A4: 595 × 842 points (210 × 297 mm)
- US Letter: 612 × 792 points (8.5 × 11 inches)

### Page Selectors

Target specific pages using page selectors:

```typescript
{ type: 'all' }                          // All pages
{ type: 'first' }                        // First page only
{ type: 'last' }                         // Last page only
{ type: 'specific', pages: [1, 3, 5] }  // Pages 1, 3, and 5
{ type: 'range', from: 2, to: 5 }       // Pages 2 through 5
```

**Negative indexing:** Use negative numbers to count from the end:
```typescript
{ type: 'specific', pages: [-1] }       // Last page
{ type: 'specific', pages: [-2] }       // Second-to-last page
```

### Rule Structure

Every processing rule requires four fields:

```typescript
{
  type: 'text',                    // 'text' or 'image'
  page: { type: 'first' },         // PageSelector (required)
  position: { x: 50, y: 750 },     // PositionSelector (required)
  element: {                        // TextElement or ImageElement (required)
    content: 'Hello'               // Element-specific properties
  }
}
```

## Running the Samples

The `samples/` directory contains demonstration scripts:

- `text-alignment-demo.ts` - Demonstrates text alignment and bounds
- `text-styling-demo.ts` - Demonstrates fonts, colors, and styling
- `pagination-demo.ts` - Demonstrates all PageSelector types

Run samples with [tsx](https://github.com/privatenumber/tsx):

```bash
npx tsx samples/text-alignment-demo.ts    # Output: samples/output/text-alignment.pdf
npx tsx samples/text-styling-demo.ts      # Output: samples/output/text-styling.pdf
npx tsx samples/pagination-demo.ts        # Output: samples/output/pagination.pdf
```

To regenerate the base PDFs (in `samples/base/`):

```bash
npm run samples:generate
```

## Features

### Currently Supported

- **Text placement** with full styling (fonts, colors, opacity, line height)
- **Text alignment** (horizontal/vertical with bounding boxes)
- **Image placement** (PNG/JPG with positioning and sizing)
- **Custom and standard fonts**
- **Multiple color formats** (hex, RGB, CMYK, grayscale)
- **Page targeting** (all, first, last, specific pages, ranges, negative indexing)

### Not Currently Supported

The following pdf-lib features are not implemented in this library:

- Interactive forms (text fields, checkboxes, radio buttons, dropdowns, signatures)
- Drawing primitives (rectangles, circles, lines, shapes, SVG paths)
- Page manipulation (adding/removing/rotating pages, merging PDFs)
- Document metadata (title, author, subject, keywords)
- Encryption and password protection
- Attachments and bookmarks
- Text rotation and transformations
- Viewer preferences and display settings

