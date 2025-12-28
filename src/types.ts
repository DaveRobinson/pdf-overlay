export type DocumentRules = {
    documentMeta: DocumentMeta
    processingRules: ProcessingRule[]
}
export type DocumentMeta = {
  fonts?: Record<string, FontDefinition>
  defaults?: DefaultTextStyle
}

export type FontDefinition =
  | { type: 'standard'; name: string }
  | { type: 'custom'; path: string }

export type DefaultTextStyle = {
  fontName?: string
  fontSize?: number
  colour?: ColourSpec
  lineHeight?: number
}

export type ColourSpec =
  | string  // hex "#FF0000" or "#F00"
  | { type: 'rgb'; r: number; g: number; b: number }
  | { type: 'cmyk'; c: number; m: number; y: number; k: number }
  | { type: 'grey'; grey: number }

export type ProcessingRule =
  | {
      type: 'text'
      position: PositionSelector
      element: TextElement
      page: PageSelector
    }
  | {
      type: 'image'
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
}
export type ImageElement = {
    path: string
    width?: number
    height?: number
}
export type PageSelector = 
| {type: 'all' }
| { type: 'specific', pages: number[] }
| { type: 'first' }
| { type: 'last' }
| { type: 'range', from: number, to: number }
