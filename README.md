# PDF Overlay

This library provides a way to add content to a PDF file by applying a structured set of rules.

## Usage

```typescript
import { processDocument } from './src/process-document'
import type { DocumentRules } from './src/types'

const rules: DocumentRules = {
  documentMeta: {
    fonts: {
      body: { type: 'standard', name: 'Helvetica' },
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

await processDocument('input.pdf', rules, 'output.pdf')
```

See the [samples](./samples) directory for more examples.

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

