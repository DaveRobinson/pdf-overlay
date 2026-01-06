export type DocumentRules = {
    documentMeta: DocumentMeta
    processingRules: ProcessingRule[]
}
export type DocumentMeta = {
  fonts?: Record<string, FontDefinition>
  defaults?: DefaultTextStyle
}

export type FontDefinition =
  | { type: 'standard'; family: string }
  | { type: 'custom'; family: string }

export type DefaultTextStyle = {
  fontName?: string
  fontSize?: number
  colour?: ColourSpec
  lineHeight?: number
  align?: HorizontalAlign
  verticalAlign?: VerticalAlign
}

export type ColourSpec =
  | string  // hex "#FF0000" or "#F00"
  | { type: 'rgb'; r: number; g: number; b: number }
  | { type: 'cmyk'; c: number; m: number; y: number; k: number }
  | { type: 'grey'; grey: number }

export type BoundsSpec = {
  width?: number
  height?: number
}

export type HorizontalAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'

export type ProcessingRule =
  | {
      type: 'text'
      label?: string
      position: PositionSelector
      element: TextElement
      page: PageSelector
    }
  | {
      type: 'image'
      label?: string
      position: PositionSelector
      element: ImageElement
      page: PageSelector
    }

export type PositionSelector = {
    x: number,
    y: number
}
export type TextElement = {
  content: string
  fontName?: string       // References a key in DocumentMeta.fonts
  fontSize?: number
  colour?: ColourSpec
  lineHeight?: number
  opacity?: number        // 0-1
  bounds?: BoundsSpec
  align?: HorizontalAlign
  verticalAlign?: VerticalAlign
}
export type ImageElement = {
  name: string
  width?: number
  height?: number
}
export type PageSelector =
| {type: 'all' }
| { type: 'specific', pages: number[] }
| { type: 'first' }
| { type: 'last' }
| { type: 'range', from: number, to: number }

/**
 * Resources for resolving fonts and images
 * Values can be either:
 * - Uint8Array: Raw file data
 * - string: URL to fetch or file path (requires basePaths in options)
 */
export type DocumentResources = {
  fonts?: Record<string, string | Uint8Array>
  images?: Record<string, string | Uint8Array>
}

/**
 * Options for processing documents
 */
export type ProcessDocumentOptions = {
  /** Pre-loaded or referenced resources */
  resources?: DocumentResources

  /** Base paths for resolving file paths in resources */
  basePaths?: {
    fonts?: string
    images?: string
  }

  /** Allow fetching remote URLs (default: false in Node.js, true in browser) */
  allowRemoteUrls?: boolean
}
