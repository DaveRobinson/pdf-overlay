import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont } from 'pdf-lib'
import { writeFile } from 'fs/promises'

// Colors for visual guides
const guideColor = rgb(0.7, 0.7, 0.7) // Light grey for lines
const boxColor = rgb(0.8, 0.8, 0.8) // Lighter grey for box fills
const labelColor = rgb(0.4, 0.4, 0.4) // Dark grey for labels

// Helper to draw a dashed vertical line
function drawVerticalLine(page: PDFPage, x: number, y1: number, y2: number) {
  const dashLength = 4
  const gapLength = 3
  let y = y1
  while (y > y2) {
    const segmentEnd = Math.max(y - dashLength, y2)
    page.drawLine({
      start: { x, y },
      end: { x, y: segmentEnd },
      thickness: 0.5,
      color: guideColor,
    })
    y = segmentEnd - gapLength
  }
}

// Helper to draw a dashed horizontal line
function drawHorizontalLine(page: PDFPage, y: number, x1: number, x2: number) {
  const dashLength = 4
  const gapLength = 3
  let x = x1
  while (x < x2) {
    const segmentEnd = Math.min(x + dashLength, x2)
    page.drawLine({
      start: { x, y },
      end: { x: segmentEnd, y },
      thickness: 0.5,
      color: guideColor,
    })
    x = segmentEnd + gapLength
  }
}

// Helper to draw a box outline
function drawBox(page: PDFPage, x: number, y: number, width: number, height: number, fill = false) {
  if (fill) {
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      color: boxColor,
      opacity: 0.3,
    })
  }
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor: guideColor,
    borderWidth: 0.5,
  })
}

// Helper to draw a small marker cross at a point
function drawMarker(page: PDFPage, x: number, y: number) {
  const size = 4
  page.drawLine({
    start: { x: x - size, y },
    end: { x: x + size, y },
    thickness: 0.5,
    color: rgb(1, 0, 0),
  })
  page.drawLine({
    start: { x, y: y - size },
    end: { x, y: y + size },
    thickness: 0.5,
    color: rgb(1, 0, 0),
  })
}

/**
 * Generates a base PDF for the text-alignment-demo with visual guides
 * showing reference points, bounds boxes, and section labels
 */
async function generateAlignmentDemoPdf() {
  const pdfDoc = await PDFDocument.create()
  const page1 = pdfDoc.addPage([595, 842]) // A4 size
  const page2 = pdfDoc.addPage([595, 842]) // A4 size - for Section 5
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Page 1 title
  page1.drawText('Text Alignment Demo - Page 1', {
    x: 50,
    y: 800,
    size: 10,
    font,
    color: labelColor,
  })

  // Section 1: Horizontal Alignment (marker at x=300)
  page1.drawText('Section 1: Vertical reference line at x=300', {
    x: 50,
    y: 745,
    size: 8,
    font,
    color: labelColor,
  })
  drawVerticalLine(page1, 300, 720, 670)
  drawMarker(page1, 300, 710)
  drawMarker(page1, 300, 695)
  drawMarker(page1, 300, 680)

  // Section 2: Alignment within Bounds (200pt wide box at x=200)
  page1.drawText('Section 2: Bounds box 200pt wide at x=200', {
    x: 50,
    y: 662,
    size: 8,
    font,
    color: labelColor,
  })
  drawBox(page1, 200, 640, 200, 50, true)
  // Draw position markers at left edge
  drawMarker(page1, 200, 630)
  drawMarker(page1, 200, 615)
  drawMarker(page1, 200, 600)

  // Section 3: Vertical Alignment (marker at y=500)
  page1.drawText('Section 3: Horizontal reference line at y=500', {
    x: 50,
    y: 582,
    size: 8,
    font,
    color: labelColor,
  })
  drawHorizontalLine(page1, 500, 80, 400)
  drawMarker(page1, 100, 500)
  drawMarker(page1, 200, 500)
  drawMarker(page1, 300, 500)

  // Section 4: Combined H+V Alignment (150x80 boxes)
  page1.drawText('Section 4: Combined alignment boxes (150x80 each)', {
    x: 50,
    y: 462,
    size: 8,
    font,
    color: labelColor,
  })

  // Row 1: Top alignment boxes (y=410)
  drawBox(page1, 50, 410, 150, 80, true)
  drawBox(page1, 220, 410, 150, 80, true)
  drawBox(page1, 390, 410, 150, 80, true)
  // Position markers
  drawMarker(page1, 50, 410)
  drawMarker(page1, 220, 410)
  drawMarker(page1, 390, 410)

  // Row 2: Middle alignment boxes (y=310)
  drawBox(page1, 50, 310, 150, 80, true)
  drawBox(page1, 220, 310, 150, 80, true)
  drawBox(page1, 390, 310, 150, 80, true)
  drawMarker(page1, 50, 310)
  drawMarker(page1, 220, 310)
  drawMarker(page1, 390, 310)

  // Row 3: Bottom alignment boxes (y=210)
  drawBox(page1, 50, 210, 150, 80, true)
  drawBox(page1, 220, 210, 150, 80, true)
  drawBox(page1, 390, 210, 150, 80, true)
  drawMarker(page1, 50, 210)
  drawMarker(page1, 220, 210)
  drawMarker(page1, 390, 210)

  // Page 2: Section 5 - Text Wrapping
  page2.drawText('Text Alignment Demo - Page 2', {
    x: 50,
    y: 800,
    size: 10,
    font,
    color: labelColor,
  })

  page2.drawText('Section 5: Text wrapping boxes (150pt wide)', {
    x: 50,
    y: 745,
    size: 8,
    font,
    color: labelColor,
  })

  // Position boxes near the top of page 2 for better visibility
  drawBox(page2, 50, 710, 150, 100, true)
  drawBox(page2, 220, 710, 150, 100, true)
  drawBox(page2, 390, 710, 150, 100, true)
  drawMarker(page2, 50, 710)
  drawMarker(page2, 220, 710)
  drawMarker(page2, 390, 710)

  // Save the PDF
  const pdfBytes = await pdfDoc.save()
  await writeFile('samples/base/alignment-demo.pdf', pdfBytes)
  console.log('✓ Generated: samples/base/alignment-demo.pdf (2 pages)')
}

generateAlignmentDemoPdf().catch(console.error)
