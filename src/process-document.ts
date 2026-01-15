import { PDFDocument, PDFPage, PDFImage, PDFFont, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { DocumentRules, ProcessingRule, DefaultTextStyle, ProcessDocumentOptions } from './types'
import { parseColour } from './colour-utils'
import { resolvePageNumbers } from './page-utils'
import { calculateAlignedX, calculateAlignedY } from './text-layout-utils'
import { resolveResource } from './resource-utils'

export type ProcessingPlan = {
  pageRules: Map<number, ProcessingRule[]>
  embeddedImages: Map<string, PDFImage>
  embeddedFonts: Map<string, PDFFont>
  defaults: DefaultTextStyle
}

/**
 * Process a PDF document by applying overlay rules
 *
 * @param pdfBytes - Source PDF as Uint8Array
 * @param rules - Document rules defining overlays to apply
 * @param options - Optional processing options (resources, basePaths, etc.)
 * @returns Processed PDF as Uint8Array
 */
export async function processDocument(
  pdfBytes: Uint8Array,
  rules: DocumentRules,
  options?: ProcessDocumentOptions
): Promise<Uint8Array> {
  // Load source PDF
  const pdfDoc = await PDFDocument.load(pdfBytes)

  // Register fontkit for custom font support
  pdfDoc.registerFontkit(fontkit)

  // Apply processing rules
  await applyRules(pdfDoc, rules, options)

  // Return processed PDF bytes
  return await pdfDoc.save()
}

/**
 * Process a PDF file by applying overlay rules (convenience wrapper for file-based workflows)
 *
 * @param sourcePath - Path to the source PDF file
 * @param rules - Document rules defining overlays to apply
 * @param outputPath - Path where the processed PDF should be written
 * @param options - Optional processing options (resources, basePaths, etc.)
 */
export async function processDocumentFile(
  sourcePath: string,
  rules: DocumentRules,
  outputPath: string,
  options?: ProcessDocumentOptions
): Promise<void> {
  const { readFile, writeFile } = await import('fs/promises')

  const pdfBytes = await readFile(sourcePath)
  const processedBytes = await processDocument(pdfBytes, rules, options)
  await writeFile(outputPath, processedBytes)
}

/**
 * Apply all processing rules to the PDF document
 */
async function applyRules(
  pdfDoc: PDFDocument,
  rules: DocumentRules,
  options?: ProcessDocumentOptions
): Promise<void> {
  // Create a plan grouping rules by page index and pre-embed images/fonts
  const plan = await createProcessingPlan(pdfDoc, rules, options)

  // Loop over the map
  for (const [pageIndex, pageRules] of plan.pageRules.entries()) {
    const page = pdfDoc.getPage(pageIndex)
    for (const rule of pageRules) {
      if (rule.type === 'text') {
        applyTextElement(page, rule, plan)
      }
      if (rule.type === 'image') {
        applyImageElement(page, rule, plan.embeddedImages)
      }
    }
  }
}

/**
 * Create a processing plan that groups rules by page index and pre-embeds images and fonts
 * @returns Processing plan with page rules, embedded images, embedded fonts, and defaults
 * @internal - Exported for testing purposes
 */
export async function createProcessingPlan(
  pdfDoc: PDFDocument,
  rules: DocumentRules,
  options?: ProcessDocumentOptions
): Promise<ProcessingPlan> {
  const pageRules = new Map<number, ProcessingRule[]>()
  const embeddedImages = new Map<string, PDFImage>()
  const embeddedFonts = new Map<string, PDFFont>()
  const pageCount = pdfDoc.getPageCount()
  const defaults = rules.documentMeta.defaults ?? {}

  // Collect font names that are actually used in processing rules
  const usedFontNames = new Set<string>()

  // Add default font if specified
  if (defaults.fontName) {
    usedFontNames.add(defaults.fontName)
  }

  // Add fonts from text rules
  for (const rule of rules.processingRules) {
    if (rule.type === 'text' && rule.element.fontName) {
      usedFontNames.add(rule.element.fontName)
    }
  }

  // Determine if we allow remote URLs (default: true in browser, false in Node.js)
  const isBrowser = typeof window !== 'undefined'
  const allowRemoteUrls = options?.allowRemoteUrls ?? isBrowser

  // Pre-embed only the fonts that are actually used
  if (rules.documentMeta.fonts) {
    for (const fontName of usedFontNames) {
      const fontDef = rules.documentMeta.fonts[fontName]
      if (!fontDef) {
        throw new Error(`Font '${fontName}' is referenced but not defined in documentMeta.fonts`)
      }

      if (fontDef.type === 'standard') {
        // Embed standard font
        const font = await pdfDoc.embedFont(fontDef.family as StandardFonts)
        embeddedFonts.set(fontName, font)
      } else if (fontDef.type === 'custom') {
        // Custom font - must be provided via resources
        if (!options?.resources?.fonts?.[fontName]) {
          throw new Error(
            `Custom font '${fontName}' not found in resources. ` +
            `Provide it in options.resources.fonts['${fontName}']`
          )
        }

        const fontBytes = await resolveResource(
          options.resources.fonts[fontName],
          options.basePaths?.fonts,
          allowRemoteUrls
        )

        const font = await pdfDoc.embedFont(fontBytes)
        embeddedFonts.set(fontName, font)
      }
    }
  }

  // Collect all unique image names referenced in rules
  const imageNames = new Set<string>()
  for (const rule of rules.processingRules) {
    if (rule.type === 'image') {
      imageNames.add(rule.element.name)
    }
  }

  // Pre-embed all referenced images from resources
  for (const imageName of imageNames) {
    if (!options?.resources?.images?.[imageName]) {
      throw new Error(
        `Image '${imageName}' not found in resources. ` +
        `Provide it in options.resources.images['${imageName}']`
      )
    }

    const imageBytes = await resolveResource(
      options.resources.images[imageName],
      options.basePaths?.images,
      allowRemoteUrls
    )

    // Detect image type and embed
    const image = await embedImageBytes(pdfDoc, imageBytes, imageName)
    embeddedImages.set(imageName, image)
  }

  // Group rules by page index
  for (const rule of rules.processingRules) {
    const pageNumbers = resolvePageNumbers(rule.page, pageCount)

    for (const pageNum of pageNumbers) {
      const pageIndex = pageNum - 1 // Convert to 0-based index for pdf-lib
      if (!pageRules.has(pageIndex)) {
        pageRules.set(pageIndex, [])
      }
      pageRules.get(pageIndex)!.push(rule)
    }
  }

  return { pageRules, embeddedImages, embeddedFonts, defaults }
}

/**
 * Embed image bytes into PDF document
 * Detects format from magic bytes
 */
async function embedImageBytes(
  pdfDoc: PDFDocument,
  imageBytes: Uint8Array,
  imageName: string
): Promise<PDFImage> {
  // Detect image type from magic bytes
  const isPng = imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && imageBytes[2] === 0x4e && imageBytes[3] === 0x47
  const isJpeg = imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff

  if (isPng) {
    return await pdfDoc.embedPng(imageBytes)
  } else if (isJpeg) {
    return await pdfDoc.embedJpg(imageBytes)
  } else {
    throw new Error(
      `Unsupported image format for '${imageName}'. ` +
      `Only PNG and JPEG are supported. ` +
      `Magic bytes: ${Array.from(imageBytes.slice(0, 4)).map(b => '0x' + b.toString(16)).join(' ')}`
    )
  }
}

/**
 * Apply a text element to a PDF page
 */
function applyTextElement(
  page: PDFPage,
  rule: Extract<ProcessingRule, { type: 'text' }>,
  plan: ProcessingPlan
): void {
  const element = rule.element

  // Resolve font (element > defaults)
  const fontName = element.fontName ?? plan.defaults.fontName
  const font = fontName ? plan.embeddedFonts.get(fontName) : undefined

  // Resolve styling options with fallbacks to defaults
  const fontSize = element.fontSize ?? plan.defaults.fontSize ?? 12
  const colourSpec = element.colour ?? plan.defaults.colour
  const colour = colourSpec ? parseColour(colourSpec) : undefined
  const lineHeight = element.lineHeight ?? plan.defaults.lineHeight
  const align = element.align ?? plan.defaults.align
  const verticalAlign = element.verticalAlign ?? plan.defaults.verticalAlign

  // Calculate position based on alignment
  // If no font is available, fall back to simple positioning
  let x = rule.position.x
  let y = rule.position.y

  if (font) {
    x = calculateAlignedX(
      rule.position.x,
      element.content,
      font,
      fontSize,
      align,
      element.bounds
    )

    y = calculateAlignedY(
      rule.position.y,
      element.content,
      font,
      fontSize,
      verticalAlign,
      element.bounds,
      lineHeight
    )
  }

  // Build draw options
  const drawOptions: any = {
    x,
    y,
    font,
    size: fontSize,
    color: colour,
    lineHeight,
    opacity: element.opacity,
  }

  // Add maxWidth if bounds.width is specified
  if (element.bounds?.width) {
    drawOptions.maxWidth = element.bounds.width
  }

  page.drawText(element.content, drawOptions)
}

/**
 * Apply an image element to a PDF page
 */
function applyImageElement(
  page: PDFPage,
  rule: Extract<ProcessingRule, { type: 'image' }>,
  embeddedImages: Map<string, PDFImage>
): void {
  // Image must be pre-embedded and cached
  const image = embeddedImages.get(rule.element.name)
  if (!image) {
    throw new Error(`Image '${rule.element.name}' not found in embedded images`)
  }

  page.drawImage(image, {
    x: rule.position.x,
    y: rule.position.y,
    width: rule.element.width,
    height: rule.element.height
  })
}

