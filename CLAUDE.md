# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pdf-overlay is a TypeScript library for placing content (text, images) on PDF files using a declarative rules-based system. Built on pdf-lib, it's distributed as both ESM and UMD bundles.

## Commands

### Development
- `npm run dev` - Start Vite dev server
- `npm run build` - Build library (runs TypeScript compiler + Vite build)
- `npm run preview` - Preview production build

### Testing
- `npm test` - Run tests in watch mode (vitest)
- `npm run test:run` - Run tests once

### Schema Generation
- `npm run generate-schema` - Generate JSON schema from DocumentRules type in src/types.ts

## Architecture

### Core Processing Flow

The library follows a two-phase processing model:

1. **Planning Phase** (`createProcessingPlan`): Pre-processes the DocumentRules to:
   - Resolve all PageSelectors to concrete page numbers
   - Group ProcessingRules by page index (0-based for pdf-lib)
   - Pre-embed all fonts and images once (crucial optimization)
   - Merge defaults from DocumentMeta with element-specific overrides

2. **Application Phase** (`applyRules`): Iterates through the plan and applies each rule to its target pages

This architecture prevents duplicate embedding of fonts/images and simplifies per-page rule application.

### API Functions

**`processDocument(pdfBytes, rules, options?)`**
- Core function: bytes in, bytes out
- Works in both Node.js and browser environments
- Returns processed PDF as Uint8Array

**`processDocumentFile(sourcePath, rules, outputPath, options?)`**
- Convenience wrapper for file-based workflows (Node.js only)
- Reads input file, processes, writes output file
- Uses `processDocument` internally

**`ProcessDocumentOptions`**
- `resources`: Map of font/image names to data (Uint8Array) or paths (string)
- `basePaths`: Base directories for resolving file paths (security boundary)
- `allowRemoteUrls`: Enable/disable URL fetching (default: false in Node.js, true in browser)

### Resources System

The resources system provides a clean separation between rules (configuration) and assets (data):

**Key Principles:**
- Rules reference fonts/images by name only
- Actual font/image data provided separately via `options.resources`
- Resources can be Uint8Array (pre-loaded) or string (file path or URL)
- File paths are resolved relative to `basePaths` with security checks
- All resources are pre-embedded once during planning phase (automatic caching)

**Security Features:**
- Path traversal protection (blocks `../` escapes)
- File access restricted to configured `basePaths`
- Remote URLs require explicit opt-in via `allowRemoteUrls`
- Buffer to Uint8Array conversion for cross-platform consistency

### Type System (src/types.ts)

The DocumentRules structure has two main sections:

- `documentMeta`: Global configuration including font definitions and default text styling
- `processingRules`: Array of rules to apply (text or image placement)

**Complete Structure Example:**

```typescript
const rules: DocumentRules = {
  documentMeta: {
    fonts: {
      main: { type: 'standard', family: 'Helvetica' },
      custom: { type: 'custom', family: 'CustomFont' }
    },
    defaults: {
      fontName: 'main',      // References key in fonts object
      fontSize: 12,
      colour: '#000000',
      lineHeight: 1.2,
      align: 'left',
      verticalAlign: 'top'
    }
  },
  processingRules: [
    {
      type: 'text',
      page: { type: 'first' },           // PageSelector (required)
      position: { x: 50, y: 750 },       // PositionSelector (required)
      element: {                          // TextElement (required)
        content: 'Hello',                 // Required
        fontName: 'main',                 // Optional overrides
        fontSize: 14,
        colour: '#FF0000'
      }
    },
    {
      type: 'image',
      page: { type: 'all' },
      position: { x: 100, y: 100 },
      element: {                          // ImageElement
        name: 'logo',                     // Required - references resources
        width: 200,
        height: 100
      }
    }
  ]
}
```

**PageSelector Types (IMPORTANT):**

```typescript
{ type: 'all' }                          // All pages
{ type: 'first' }                        // First page only
{ type: 'last' }                         // Last page only
{ type: 'specific', pages: [1, 3, 5] }  // Specific page numbers (1-based)
{ type: 'range', from: 2, to: 5 }       // Page range (inclusive)
```

**Key Design Patterns:**
- **Processing rule structure**: Always has `type`, `page`, `position`, and `element` fields
- **Font definitions**: Explicit type ('standard' or 'custom') with `family` field. Custom fonts must be provided via resources.
- **Font references**: Use `fontName` field (not `font`) to reference keys in `documentMeta.fonts`
- **Image references**: Images use `name` field in element that references resources (no inline data or paths)
- **Resources system**: All custom fonts and images are provided separately via `ProcessDocumentOptions.resources`
- **Security**: File paths resolved via `basePaths` with path traversal protection
- **PageSelectors**: Support negative indexing in page numbers (-1 = last page, -2 = second-to-last)
- **Styling cascades**: element-specific → documentMeta.defaults → undefined
- **ColourSpec**: Multiple formats: hex strings ('#FF0000' or '#F00'), RGB objects, CMYK objects, greyscale objects
- **Dimensions**: All positions/bounds in PDF points (1/72 inch)
- **Coordinate System**: PDF uses a bottom-left origin. Position (0, 0) is the bottom-left corner of the page, x increases to the right, y increases upward. An A4 page is 595 x 842 points, so position { x: 50, y: 792 } is near the top-left of the page.

### Utility Modules

- `page-utils.ts`: Handles PageSelector resolution and negative page number normalization
- `colour-utils.ts`: Converts ColourSpec types to pdf-lib Color objects
- `text-layout-utils.ts`: Text measurement and alignment position calculations using pdf-lib font metrics
- `resource-utils.ts`: Resource resolution with security controls (path traversal protection, URL fetching, Uint8Array conversion)

### Build Configuration

Vite is configured for library mode (vite.config.ts):
- Entry point: src/index.ts
- Outputs: ESM (pdf-overlay.js) and UMD (pdf-overlay.umd.cjs)
- TypeScript definitions generated via vite-plugin-dts

## Testing Strategy

Tests are located in the `tests/` directory. The test suite focuses on:
- Unit testing utility functions (page-utils, colour-utils, text-layout-utils, resource-utils)
- Unit testing the planning phase in isolation (process-document.unit.test.ts)
- Security testing for resource resolution (path traversal, URL validation)

When testing the createProcessingPlan function, note that it's exported with `@internal` comment for testing purposes only.

## Current Features

### Text Placement
- **Styling**: Font selection (standard + custom fonts), fontSize, colour (hex/RGB/CMYK/grey), lineHeight, opacity
- **Layout & Alignment**:
  - Horizontal alignment: left/center/right (with or without bounds)
  - Vertical alignment: top/middle/bottom (with or without bounds)
  - Bounding boxes: Text wrapping via bounds.width, bounds.height for alignment calculations
  - Position calculation using pdf-lib font metrics (widthOfTextAtSize, heightAtSize)
- **Cascading defaults**: All styling and alignment properties support element → defaults cascade

### Image Placement
- Image placement via named resources with position and optional width/height
- Format detection via magic bytes (PNG/JPG supported)
- Pre-embedding during planning phase (automatic caching)
- All images must be provided via resources (no inline data or direct paths)

## Unsupported pdf-lib Features

The library intentionally does not implement the following pdf-lib capabilities:

- **Interactive forms**: Text fields, checkboxes, radio buttons, dropdowns, signatures
- **Drawing primitives**: Rectangles, circles, lines, shapes, SVG paths
- **Page manipulation**: Adding/removing/rotating pages, merging PDFs
- **Document metadata**: Title, author, subject, keywords
- **Security**: Encryption and password protection
- **Document structure**: Attachments, bookmarks
- **Transformations**: Text rotation, coordinate transformations
- **Viewer settings**: Viewer preferences and display settings

These features are not needed for the library's core use case of placing text and images on existing PDFs.

## Samples

The `samples/` directory contains demonstration scripts:
- `text-alignment-demo.ts` - Comprehensive text alignment and bounds demonstration
- `text-styling-demo.ts` - Font, color, and styling features demonstration

Run samples using tsx: `npx tsx samples/text-alignment-demo.ts`

**Note:** Samples use the new API with `processDocumentFile` and resources-based asset management.
