import { describe, it, expect, beforeEach } from 'vitest'
import { measureTextWidth, measureTextHeight, calculateAlignedX, calculateAlignedY } from '../src/text-layout-utils'
import type { PDFFont } from 'pdf-lib'

// Mock PDFFont for testing
function createMockFont(charWidth = 10, fontHeight = 12): PDFFont {
  return {
    widthOfTextAtSize: (text: string, size: number) => {
      // Simple mock: each character is charWidth units at size 12
      return (text.length * charWidth * size) / 12
    },
    heightAtSize: (size: number) => {
      // Simple mock: font height scales linearly
      return (fontHeight * size) / 12
    },
  } as PDFFont
}

describe('measureTextWidth', () => {
  let mockFont: PDFFont

  beforeEach(() => {
    mockFont = createMockFont(10, 12)
  })

  it('should measure width of single line text', () => {
    const width = measureTextWidth('Hello', mockFont, 12)
    expect(width).toBe(50) // 5 chars * 10 units
  })

  it('should return 0 for empty string', () => {
    const width = measureTextWidth('', mockFont, 12)
    expect(width).toBe(0)
  })

  it('should measure width at different font sizes', () => {
    const width = measureTextWidth('Test', mockFont, 24)
    expect(width).toBe(80) // 4 chars * 10 units * (24/12)
  })

  it('should return widest line for multiline text', () => {
    const text = 'Short\nThis is a longer line\nMed'
    const width = measureTextWidth(text, mockFont, 12)
    // "This is a longer line" = 21 chars * 10 = 210
    expect(width).toBe(210)
  })

  it('should handle text with only newlines', () => {
    const width = measureTextWidth('\n\n', mockFont, 12)
    expect(width).toBe(0)
  })

  it('should handle text with trailing newline', () => {
    const width = measureTextWidth('Hello\n', mockFont, 12)
    expect(width).toBe(50)
  })
})

describe('measureTextHeight', () => {
  let mockFont: PDFFont

  beforeEach(() => {
    mockFont = createMockFont(10, 12)
  })

  it('should measure height of single line text', () => {
    const height = measureTextHeight('Hello', mockFont, 12)
    expect(height).toBe(12) // baseHeight
  })

  it('should measure height of multiline text without lineHeight', () => {
    const text = 'Line 1\nLine 2\nLine 3'
    const height = measureTextHeight(text, mockFont, 12)
    // 3 lines: baseHeight + (fontSize * (lineCount - 1))
    // 12 + (12 * 2) = 36
    expect(height).toBe(36)
  })

  it('should measure height of multiline text with custom lineHeight', () => {
    const text = 'Line 1\nLine 2\nLine 3'
    const height = measureTextHeight(text, mockFont, 12, 18)
    // 3 lines: baseHeight + (lineHeight * (lineCount - 1))
    // 12 + (18 * 2) = 48
    expect(height).toBe(48)
  })

  it('should scale with font size', () => {
    const height = measureTextHeight('Hello', mockFont, 24)
    expect(height).toBe(24) // baseHeight scales
  })

  it('should handle empty string as single line', () => {
    const height = measureTextHeight('', mockFont, 12)
    expect(height).toBe(12)
  })

  it('should count empty lines in multiline text', () => {
    const text = 'Line 1\n\nLine 3'
    const height = measureTextHeight(text, mockFont, 12)
    // 3 lines (empty line counts)
    expect(height).toBe(36)
  })
})

describe('calculateAlignedX', () => {
  let mockFont: PDFFont

  beforeEach(() => {
    mockFont = createMockFont(10, 12)
  })

  describe('without bounds', () => {
    it('should return baseX for left alignment', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'left', undefined)
      expect(x).toBe(100)
    })

    it('should return baseX for undefined alignment (default left)', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, undefined, undefined)
      expect(x).toBe(100)
    })

    it('should center text for center alignment', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'center', undefined)
      // text width = 50, so center at baseX - 25
      expect(x).toBe(75)
    })

    it('should right-align text for right alignment', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'right', undefined)
      // text width = 50, so right edge at baseX - 50
      expect(x).toBe(50)
    })

    it('should handle empty string', () => {
      const x = calculateAlignedX(100, '', mockFont, 12, 'center', undefined)
      expect(x).toBe(100) // width is 0, so centered at baseX
    })
  })

  describe('with bounds', () => {
    it('should return baseX for left alignment with bounds', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'left', { width: 200 })
      expect(x).toBe(100)
    })

    it('should center text within bounds', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'center', { width: 200 })
      // bounds center at 100 + 100 = 200, text width = 50, so x = 200 - 25 = 175
      expect(x).toBe(175)
    })

    it('should right-align text within bounds', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'right', { width: 200 })
      // right edge at 100 + 200 = 300, text width = 50, so x = 300 - 50 = 250
      expect(x).toBe(250)
    })

    it('should handle text wider than bounds (center) - uses bounds width for alignment', () => {
      const x = calculateAlignedX(100, 'Very long text here', mockFont, 12, 'center', { width: 50 })
      // text width = 190, bounds width = 50
      // effectiveWidth = min(190, 50) = 50 (text will wrap to fill bounds)
      // center calculation: 100 + 25 - 25 = 100
      expect(x).toBe(100)
    })

    it('should handle text wider than bounds (right) - uses bounds width for alignment', () => {
      const x = calculateAlignedX(100, 'Very long text here', mockFont, 12, 'right', { width: 50 })
      // text width = 190, bounds width = 50
      // effectiveWidth = min(190, 50) = 50 (text will wrap to fill bounds)
      // right calculation: 100 + 50 - 50 = 100
      expect(x).toBe(100)
    })

    it('should ignore bounds.height when calculating x', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'center', { height: 50 })
      // No width in bounds, so treat as no bounds
      expect(x).toBe(75)
    })

    it('should fall back to baseX for invalid alignment with bounds', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'invalid' as any, { width: 200 })
      expect(x).toBe(100)
    })

    it('should fall back to baseX for invalid alignment without bounds', () => {
      const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'invalid' as any, undefined)
      expect(x).toBe(100)
    })
  })

  describe('multiline text', () => {
    it('should use widest line for alignment', () => {
      const text = 'Hi\nThis is longer\nOk'
      const x = calculateAlignedX(100, text, mockFont, 12, 'center', undefined)
      // widest line = "This is longer" = 14 chars = 140 width
      // center at 100 - 70 = 30
      expect(x).toBe(30)
    })
  })
})

describe('calculateAlignedY', () => {
  let mockFont: PDFFont

  beforeEach(() => {
    mockFont = createMockFont(10, 12)
  })

  describe('without bounds', () => {
    it('should position text at top for top alignment', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, 'top', undefined)
      // text height = 12, descent = 0 (12 - 12)
      // top: baseY - textHeight + descent = 200 - 12 + 0 = 188
      expect(y).toBe(188)
    })

    it('should position text at top for undefined alignment (default)', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, undefined, undefined)
      expect(y).toBe(188)
    })

    it('should center text vertically for middle alignment', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, 'middle', undefined)
      // middle: baseY - (textHeight / 2) + descent = 200 - 6 + 0 = 194
      expect(y).toBe(194)
    })

    it('should position at baseline for bottom alignment', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, 'bottom', undefined)
      // bottom: baseY + descent = 200 + 0 = 200
      expect(y).toBe(200)
    })
  })

  describe('with bounds', () => {
    it('should position at top of bounds for top alignment', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, 'top', { height: 100 })
      // top of bounds: baseY - textHeight + descent = 200 - 12 + 0 = 188
      expect(y).toBe(188)
    })

    it('should center text within bounds', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, 'middle', { height: 100 })
      // center in bounds: baseY - (boundsHeight / 2) - (textHeight / 2) + descent
      // 200 - 50 - 6 + 0 = 144
      expect(y).toBe(144)
    })

    it('should position at bottom of bounds', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, 'bottom', { height: 100 })
      // bottom of bounds: baseY - boundsHeight + descent = 200 - 100 + 0 = 100
      expect(y).toBe(100)
    })

    it('should ignore bounds.width when calculating y', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, 'middle', { width: 50 })
      // No height in bounds, so treat as no bounds
      expect(y).toBe(194)
    })

    it('should fall back to top alignment for invalid alignment with bounds', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 12, 'invalid' as any, { height: 100 })
      // Falls through to default (top alignment): baseY - textHeight + descent = 200 - 12 + 0 = 188
      expect(y).toBe(188)
    })
  })

  describe('multiline text', () => {
    it('should account for total height in alignment', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const y = calculateAlignedY(200, text, mockFont, 12, 'top', undefined)
      // text height = 36 (12 + 12 + 12)
      // top: 200 - 36 + 0 = 164
      expect(y).toBe(164)
    })

    it('should use lineHeight for multiline text', () => {
      const text = 'Line 1\nLine 2'
      const y = calculateAlignedY(200, text, mockFont, 12, 'top', undefined, 18)
      // text height with lineHeight = 12 + 18 = 30
      // top: 200 - 30 + 0 = 170
      expect(y).toBe(170)
    })
  })

  describe('different font sizes', () => {
    it('should scale with font size', () => {
      const y = calculateAlignedY(200, 'Hello', mockFont, 24, 'top', undefined)
      // text height = 24, descent = 0 (24 - 24)
      // top: 200 - 24 + 0 = 176
      expect(y).toBe(176)
    })
  })
})

describe('integration tests', () => {
  let mockFont: PDFFont

  beforeEach(() => {
    mockFont = createMockFont(10, 12)
  })

  it('should handle combined horizontal and vertical alignment', () => {
    const x = calculateAlignedX(100, 'Hello', mockFont, 12, 'center', { width: 200 })
    const y = calculateAlignedY(100, 'Hello', mockFont, 12, 'middle', { height: 50 })

    expect(x).toBe(175) // centered horizontally in bounds
    expect(y).toBe(69)  // centered vertically in bounds
  })

  it('should handle multiline text with bounds and alignment', () => {
    const text = 'Line 1\nLine 2'
    const x = calculateAlignedX(50, text, mockFont, 12, 'right', { width: 100 })
    const y = calculateAlignedY(200, text, mockFont, 12, 'bottom', { height: 80 })

    // x: right align widest line (both are 6 chars = 60 width)
    // 50 + 100 - 60 = 90
    expect(x).toBe(90)

    // y: bottom of bounds
    // 200 - 80 + 0 = 120
    expect(y).toBe(120)
  })
})
