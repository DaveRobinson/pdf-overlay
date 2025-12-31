# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pdf-overlay is a TypeScript library for adding overlays (text, images) to PDF files using a declarative rules-based system. Built on pdf-lib, it's distributed as both ESM and UMD bundles.

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

### Type System (src/types.ts)

The DocumentRules structure has two main sections:

- `documentMeta`: Global configuration including font definitions and default text styling
- `processingRules`: Array of rules to apply (text or image overlays)

**Key Design Patterns:**
- Font definitions are named references (e.g., 'body', 'heading') that get resolved during planning
- PageSelectors support negative indexing (-1 = last page, -2 = second-to-last)
- Styling cascades: element-specific → documentMeta.defaults → undefined
- ColourSpec supports multiple formats: hex strings, RGB, CMYK, greyscale
- All dimensions (bounds, positions) are in PDF points (1/72 inch)

### Utility Modules

- `page-utils.ts`: Handles PageSelector resolution and negative page number normalization
- `colour-utils.ts`: Converts ColourSpec types to pdf-lib Color objects
- `text-layout-utils.ts`: Text measurement and alignment position calculations using pdf-lib font metrics

### Build Configuration

Vite is configured for library mode (vite.config.ts):
- Entry point: src/index.ts
- Outputs: ESM (pdf-overlay.js) and UMD (pdf-overlay.umd.cjs)
- TypeScript definitions generated via vite-plugin-dts

## Testing Strategy

Tests are located in the `tests/` directory. The test suite focuses on:
- Unit testing utility functions (page-utils, colour-utils, text-layout-utils)
- Unit testing the planning phase in isolation (process-document.unit.test.ts)

When testing the createProcessingPlan function, note that it's exported with `@internal` comment for testing purposes only.

## Current Features

### Text Overlays
- **Styling**: Font selection (standard + custom fonts), fontSize, colour (hex/RGB/CMYK/grey), lineHeight, opacity
- **Layout & Alignment** (Phase 2):
  - Horizontal alignment: left/center/right (with or without bounds)
  - Vertical alignment: top/middle/bottom (with or without bounds)
  - Bounding boxes: Text wrapping via bounds.width, bounds.height for alignment calculations
  - Position calculation using pdf-lib font metrics (widthOfTextAtSize, heightAtSize)
- **Cascading defaults**: All styling and alignment properties support element → defaults cascade

### Image Overlays
- Basic image placement with position and optional width/height
- Pre-embedding of images (PNG/JPG)
