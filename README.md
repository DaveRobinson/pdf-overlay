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
      position: { x: 50, y: 750 },
      element: { content: 'Header on all pages' },
      page: { type: 'all' },
    },
    {
      type: 'text',
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

