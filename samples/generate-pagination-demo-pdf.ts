import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { writeFile } from 'fs/promises'

const PAGE_COUNT = 6

// Colors
const guideColor = rgb(0.75, 0.75, 0.75)
const labelColor = rgb(0.5, 0.5, 0.5)
const pageNumColor = rgb(0.85, 0.85, 0.85)

/**
 * Generates a multi-page base PDF for demonstrating pagination options.
 * Each page has labeled zones showing where different PageSelector demos will place content.
 */
async function generatePaginationDemoPdf() {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  for (let i = 1; i <= PAGE_COUNT; i++) {
    const page = pdfDoc.addPage([595, 842]) // A4

    // Large watermark-style page number in center
    page.drawText(String(i), {
      x: 250,
      y: 350,
      size: 200,
      font: boldFont,
      color: pageNumColor,
    })

    // Page indicator at top
    page.drawText(`Page ${i} of ${PAGE_COUNT}`, {
      x: 480,
      y: 820,
      size: 10,
      font,
      color: labelColor,
    })

    // Header zone (y=780-800)
    page.drawLine({
      start: { x: 50, y: 780 },
      end: { x: 545, y: 780 },
      thickness: 0.5,
      color: guideColor,
    })
    page.drawText('Header zone - type: "all" demo', {
      x: 50,
      y: 785,
      size: 7,
      font,
      color: labelColor,
    })

    // First page only zone (y=720-750)
    page.drawRectangle({
      x: 50,
      y: 720,
      width: 200,
      height: 30,
      borderColor: guideColor,
      borderWidth: 0.5,
    })
    page.drawText('type: "first"', {
      x: 55,
      y: 735,
      size: 7,
      font,
      color: labelColor,
    })

    // Last page only zone (y=720-750, right side)
    page.drawRectangle({
      x: 345,
      y: 720,
      width: 200,
      height: 30,
      borderColor: guideColor,
      borderWidth: 0.5,
    })
    page.drawText('type: "last"', {
      x: 350,
      y: 735,
      size: 7,
      font,
      color: labelColor,
    })

    // Specific pages zone (y=660-690)
    page.drawRectangle({
      x: 50,
      y: 660,
      width: 495,
      height: 30,
      borderColor: guideColor,
      borderWidth: 0.5,
    })
    page.drawText('type: "specific" - pages [2, 4, 6]', {
      x: 55,
      y: 675,
      size: 7,
      font,
      color: labelColor,
    })

    // Range zone (y=600-630)
    page.drawRectangle({
      x: 50,
      y: 600,
      width: 495,
      height: 30,
      borderColor: guideColor,
      borderWidth: 0.5,
    })
    page.drawText('type: "range" - from: 2, to: 4', {
      x: 55,
      y: 615,
      size: 7,
      font,
      color: labelColor,
    })

    // Negative index zone (y=540-570)
    page.drawRectangle({
      x: 50,
      y: 540,
      width: 495,
      height: 30,
      borderColor: guideColor,
      borderWidth: 0.5,
    })
    page.drawText('type: "specific" - pages [-1, -2] (last two pages)', {
      x: 55,
      y: 555,
      size: 7,
      font,
      color: labelColor,
    })

    // Footer zone (y=50)
    page.drawLine({
      start: { x: 50, y: 60 },
      end: { x: 545, y: 60 },
      thickness: 0.5,
      color: guideColor,
    })
    page.drawText('Footer zone - type: "all" demo', {
      x: 50,
      y: 50,
      size: 7,
      font,
      color: labelColor,
    })
  }

  const pdfBytes = await pdfDoc.save()
  await writeFile('samples/base/pagination-demo.pdf', pdfBytes)
  console.log(`✓ Generated: samples/base/pagination-demo.pdf (${PAGE_COUNT} pages)`)
}

generatePaginationDemoPdf().catch(console.error)
