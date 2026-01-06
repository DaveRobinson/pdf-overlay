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

**Key Design Patterns:**
- **Font definitions**: Explicit type ('standard' or 'custom') with `family` field. Custom fonts must be provided via resources.
- **Image references**: Images use `name` field that references resources (no inline data or paths)
- **Resources system**: All custom fonts and images are provided separately via `ProcessDocumentOptions.resources`
- **Security**: File paths resolved via `basePaths` with path traversal protection
- **PageSelectors**: Support negative indexing (-1 = last page, -2 = second-to-last)
- **Styling cascades**: element-specific → documentMeta.defaults → undefined
- **ColourSpec**: Multiple formats: hex strings, RGB, CMYK, greyscale
- **Dimensions**: All positions/bounds in PDF points (1/72 inch)

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
