import { PDFDocument, PDFPage, PDFImage, PDFFont, StandardFonts } from 'pdf-lib'
import { readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import type { DocumentRules, ProcessingRule, DefaultTextStyle } from './types'
import { parseColour } from './colour-utils'
import { resolvePageNumbers } from './page-utils'

export type ProcessingPlan = {
  pageRules: Map<number, ProcessingRule[]>
  embeddedImages: Map<string, PDFImage>
  embeddedFonts: Map<string, PDFFont>
  defaults: DefaultTextStyle
}

/**
 * Process a PDF document by applying overlay rules
 *
 * @param sourcePath - Path to the source PDF file
 * @param rules - Document rules defining overlays to apply
 * @param outputPath - Optional output path (defaults to temp file)
 * @returns Path to the processed PDF file
 */
export async function processDocument(
  sourcePath: string,
  rules: DocumentRules,
  outputPath?: string
): Promise<string> {
  // Load source PDF
  const existingPdfBytes = await readFile(sourcePath)
  const pdfDoc = await PDFDocument.load(existingPdfBytes)

  // Apply processing rules
  await applyRules(pdfDoc, rules)

  // Save to file
  const pdfBytes = await pdfDoc.save()
  const finalPath = outputPath ?? generateTempPath()
  await writeFile(finalPath, pdfBytes)

  return finalPath
}

/**
 * Apply all processing rules to the PDF document
 */
async function applyRules(pdfDoc: PDFDocument, rules: DocumentRules): Promise<void> {
  // Create a plan grouping rules by page index and pre-embed images/fonts
  const plan = await createProcessingPlan(pdfDoc, rules)

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
  rules: DocumentRules
): Promise<ProcessingPlan> {
  const pageRules = new Map<number, ProcessingRule[]>()
  const embeddedImages = new Map<string, PDFImage>()
  const embeddedFonts = new Map<string, PDFFont>()
  const pageCount = pdfDoc.getPageCount()
  const defaults = rules.documentMeta.defaults ?? {}

  // Pre-embed fonts from DocumentMeta
  if (rules.documentMeta.fonts) {
    for (const [fontName, fontDef] of Object.entries(rules.documentMeta.fonts)) {
      if (fontDef.type === 'standard') {
        const font = await pdfDoc.embedFont(fontDef.name as StandardFonts)
        embeddedFonts.set(fontName, font)
      } else if (fontDef.type === 'custom') {
        const fontBytes = await readFile(fontDef.path)
        const font = await pdfDoc.embedFont(fontBytes)
        embeddedFonts.set(fontName, font)
      }
    }
  }

  // Collect unique image paths
  const imagePaths = new Set<string>()
  for (const rule of rules.processingRules) {
    if (rule.type === 'image') {
      imagePaths.add(rule.element.path)
    }
  }

  // Pre-embed all unique images
  for (const imagePath of imagePaths) {
    const imageBytes = await readFile(imagePath)
    const extension = imagePath.toLowerCase().split('.').pop()

    let image: PDFImage
    if (extension === 'png') {
      image = await pdfDoc.embedPng(imageBytes)
    } else if (extension === 'jpg' || extension === 'jpeg') {
      image = await pdfDoc.embedJpg(imageBytes)
    } else {
      throw new Error(`Unsupported image format: ${extension}`)
    }

    embeddedImages.set(imagePath, image)
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
 * Generate a unique temporary file path
 */
function generateTempPath(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return join(tmpdir(), `pdf-overlay-${timestamp}-${random}.pdf`)
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

  // Resolve other styling options with fallbacks to defaults
  const fontSize = element.fontSize ?? plan.defaults.fontSize
  const colourSpec = element.colour ?? plan.defaults.colour
  const colour = colourSpec ? parseColour(colourSpec) : undefined
  const lineHeight = element.lineHeight ?? plan.defaults.lineHeight

  page.drawText(element.content, {
    x: rule.position.x,
    y: rule.position.y,
    font,
    size: fontSize,
    color: colour,
    lineHeight,
    opacity: element.opacity,
  })
}

/**
 * Apply an image element to a PDF page
 */
function applyImageElement(
  page: PDFPage,
  rule: Extract<ProcessingRule, { type: 'image' }>,
  embeddedImages: Map<string, PDFImage>
): void {
  const image = embeddedImages.get(rule.element.path)
  if (!image) {
    throw new Error(`Image not found in embedded images: ${rule.element.path}`)
  }

  page.drawImage(image, {
    x: rule.position.x,
    y: rule.position.y,
    width: rule.element.width,
    height: rule.element.height
  })
}

