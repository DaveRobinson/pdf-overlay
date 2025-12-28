import { PDFDocument, PDFPage, PDFImage } from 'pdf-lib'
import { readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import type { DocumentRules, ProcessingRule } from './types'

type ProcessingPlan = {
  pageRules: Map<number, ProcessingRule[]>
  embeddedImages: Map<string, PDFImage>
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
  // Create a plan grouping rules by page index and pre-embed images
  const plan = await createProcessingPlan(pdfDoc, rules)

  // Loop over the map
  for (const [pageIndex, pageRules] of plan.pageRules.entries()) {
    const page = pdfDoc.getPage(pageIndex)
    for (const rule of pageRules) {
      if (rule.type === 'text') {
        applyTextElement(page, rule)
      }
      if (rule.type === 'image') {
        applyImageElement(page, rule, plan.embeddedImages)
      }
    }
  }
}

/**
 * Create a processing plan that groups rules by page index and pre-embeds images
 * @returns Processing plan with page rules and embedded images
 */
async function createProcessingPlan(
  pdfDoc: PDFDocument,
  rules: DocumentRules
): Promise<ProcessingPlan> {
  const pageRules = new Map<number, ProcessingRule[]>()
  const embeddedImages = new Map<string, PDFImage>()
  const pageCount = pdfDoc.getPageCount()

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

  return { pageRules, embeddedImages }
}

/**
 * Resolve a PageSelector to actual page numbers
 * Supports negative numbers to count backwards from the end (e.g., -1 = last page, -2 = second-to-last)
 * @returns Array of page numbers (1-based)
 */
function resolvePageNumbers(selector: PageSelector, pageCount: number): number[] {
  switch (selector.type) {
    case 'all':
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    case 'specific':
      return selector.pages.map(p => normalizePageNumber(p, pageCount))
    case 'first':
      return [1]
    case 'last':
      return [pageCount]
    case 'range': {
      const from = normalizePageNumber(selector.from, pageCount)
      const to = normalizePageNumber(selector.to, pageCount)
      return Array.from(
        { length: to - from + 1 },
        (_, i) => from + i
      )
    }
  }
}

/**
 * Normalize a page number, converting negative numbers to count from the end
 * @param pageNum - Page number (1-based or negative)
 * @param pageCount - Total number of pages
 * @returns Normalized page number (1-based)
 */
function normalizePageNumber(pageNum: number, pageCount: number): number {
  if (pageNum < 0) {
    return pageCount + pageNum + 1
  }
  return pageNum
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
  rule: Extract<ProcessingRule, { type: 'text' }>
): void {
  page.drawText(rule.element.content, {
    x: rule.position.x,
    y: rule.position.y
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

