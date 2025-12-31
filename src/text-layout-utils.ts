import type { PDFFont } from 'pdf-lib'
import type { BoundsSpec, HorizontalAlign, VerticalAlign } from './types'

/**
 * Measure the width of text at a given size
 * For multiline text, returns the width of the widest line
 *
 * @param text - The text content to measure
 * @param font - The PDF font to use for measurement
 * @param fontSize - The font size in PDF points
 * @returns The text width in PDF points
 */
export function measureTextWidth(
  text: string,
  font: PDFFont,
  fontSize: number
): number {
  if (text.length === 0) {
    return 0
  }

  // Split by newlines to handle multiline text
  const lines = text.split('\n')

  // Find the widest line
  let maxWidth = 0
  for (const line of lines) {
    const width = font.widthOfTextAtSize(line, fontSize)
    if (width > maxWidth) {
      maxWidth = width
    }
  }

  return maxWidth
}

/**
 * Measure the height of text at a given size
 * For multiline text, multiplies by line count and applies lineHeight
 *
 * @param text - The text content to measure
 * @param font - The PDF font to use for measurement
 * @param fontSize - The font size in PDF points
 * @param lineHeight - Optional line height in PDF points (spacing between baselines)
 * @returns The text height in PDF points
 */
export function measureTextHeight(
  text: string,
  font: PDFFont,
  fontSize: number,
  lineHeight?: number
): number {
  const baseHeight = font.heightAtSize(fontSize)

  // Count lines in the text
  const lineCount = text.split('\n').length

  if (lineCount === 1) {
    return baseHeight
  }

  // For multiline text, apply lineHeight if specified
  // lineHeight in pdf-lib is the spacing between baselines
  const effectiveLineHeight = lineHeight ?? fontSize

  // First line uses baseHeight, subsequent lines use lineHeight
  return baseHeight + (effectiveLineHeight * (lineCount - 1))
}

/**
 * Calculate the x position based on horizontal alignment
 *
 * @param baseX - The base x coordinate in PDF points (left edge of bounds or text)
 * @param text - The text content to measure
 * @param font - The PDF font to use for measurement
 * @param fontSize - The font size in PDF points
 * @param align - The horizontal alignment (undefined means left)
 * @param bounds - Optional bounding box with dimensions in PDF points
 * @returns The calculated x position in PDF points for pdf-lib's drawText
 */
export function calculateAlignedX(
  baseX: number,
  text: string,
  font: PDFFont,
  fontSize: number,
  align: HorizontalAlign | undefined,
  bounds: BoundsSpec | undefined
): number {
  // Default to left alignment
  if (!align || align === 'left') {
    return baseX
  }

  const textWidth = measureTextWidth(text, font, fontSize)

  if (bounds?.width !== undefined) {
    // With bounds: align within the bounding box
    switch (align) {
      case 'center':
        return baseX + (bounds.width / 2) - (textWidth / 2)
      case 'right':
        return baseX + bounds.width - textWidth
      default:
        return baseX
    }
  } else {
    // Without bounds: align relative to baseX
    switch (align) {
      case 'center':
        return baseX - (textWidth / 2)
      case 'right':
        return baseX - textWidth
      default:
        return baseX
    }
  }
}

/**
 * Calculate the y position based on vertical alignment
 *
 * Note: PDF coordinates have origin at bottom-left, y increases upward.
 * pdf-lib's drawText positions at the text baseline.
 *
 * @param baseY - The base y coordinate in PDF points (top edge of bounds or text area in user terms)
 * @param text - The text content to measure
 * @param font - The PDF font to use for measurement
 * @param fontSize - The font size in PDF points
 * @param verticalAlign - The vertical alignment (undefined means top)
 * @param bounds - Optional bounding box with dimensions in PDF points
 * @param lineHeight - Optional line height in PDF points for multiline text
 * @returns The calculated y position in PDF points for pdf-lib's drawText (baseline position)
 */
export function calculateAlignedY(
  baseY: number,
  text: string,
  font: PDFFont,
  fontSize: number,
  verticalAlign: VerticalAlign | undefined,
  bounds: BoundsSpec | undefined,
  lineHeight?: number
): number {
  const textHeight = measureTextHeight(text, font, fontSize, lineHeight)

  // Get font metrics for baseline calculations
  const fontHeight = font.heightAtSize(fontSize)
  const descent = fontHeight - fontSize // Approximate descent

  if (bounds?.height !== undefined) {
    // With bounds: align within the bounding box
    // baseY is the top of the bounding box in PDF coords (highest y value)

    switch (verticalAlign) {
      case 'top':
        // Top alignment: position text at top of bounds
        // In PDF coords, "top" means highest y, so we subtract text height
        return baseY - textHeight + descent
      case 'middle':
        // Middle alignment: center vertically within bounds
        return baseY - (bounds.height / 2) - (textHeight / 2) + descent
      case 'bottom':
        // Bottom alignment: position text at bottom of bounds
        return baseY - bounds.height + descent
      default:
        // Default to top alignment
        return baseY - textHeight + descent
    }
  } else {
    // Without bounds: align relative to baseY
    // baseY represents the top of the text in user terms

    switch (verticalAlign) {
      case 'top':
        // Top alignment: baseY is top, subtract text height to get baseline
        return baseY - textHeight + descent
      case 'middle':
        // Middle alignment: baseY is middle, adjust by half text height
        return baseY - (textHeight / 2) + descent
      case 'bottom':
        // Bottom alignment: baseY is bottom (baseline in PDF terms)
        return baseY + descent
      default:
        // Default: baseY is top of text
        return baseY - textHeight + descent
    }
  }
}
