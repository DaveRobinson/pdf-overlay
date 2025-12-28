export type DocumentRules = {
    documentMeta: DocumentMeta
    processingRules: ProcessingRule[]
}
export type DocumentMeta = {}

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
