import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { writeFile } from 'fs/promises'

/**
 * Generates a base PDF for the text-styling-demo with visual guides
 * showing numbered test positions
 */
async function generateStylingDemoPdf() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Colors for visual guides
  const guideColor = rgb(0.7, 0.7, 0.7) // Light grey
  const labelColor = rgb(0.4, 0.4, 0.4) // Dark grey

  // Helper to draw a small marker cross at a point
  const drawMarker = (x: number, y: number) => {
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

  // Page title
  page.drawText('Base PDF for Text Styling Demo', {
    x: 300,
    y: 800,
    size: 10,
    font,
    color: labelColor,
  })

  // Test positions - matching text-styling-demo.ts
  const tests = [
    { y: 750, label: 'Test 1: Default styling' },
    { y: 720, label: 'Test 2: Bold font' },
    { y: 690, label: 'Test 3: Hex colour (shorthand)' },
    { y: 660, label: 'Test 4: Hex colour (full)' },
    { y: 630, label: 'Test 5: RGB object' },
    { y: 600, label: 'Test 6: Grey colour' },
    { y: 560, label: 'Test 7: Large font size' },
    { y: 520, label: 'Test 8: Multiple overrides' },
    { y: 490, label: 'Test 9: Opacity' },
    { y: 450, label: 'Test 10: Line height (multiline)' },
    { y: 360, label: 'Test 11: Monospace font' },
    { y: 320, label: 'Test 12: CMYK colour' },
  ]

  // Draw horizontal guide lines and labels at each test position
  for (const test of tests) {
    // Draw a faint horizontal line across the page at this y position
    page.drawLine({
      start: { x: 30, y: test.y },
      end: { x: 565, y: test.y },
      thickness: 0.25,
      color: guideColor,
    })

    // Draw position marker at x=50
    drawMarker(50, test.y)

    // Draw the test label on the right side
    page.drawText(test.label, {
      x: 350,
      y: test.y - 3,
      size: 7,
      font,
      color: labelColor,
    })
  }

  // Add a left margin indicator line
  page.drawLine({
    start: { x: 50, y: 770 },
    end: { x: 50, y: 300 },
    thickness: 0.25,
    color: guideColor,
    dashArray: [2, 2],
  })

  // Save the PDF
  const pdfBytes = await pdfDoc.save()
  await writeFile('samples/base/styling-demo.pdf', pdfBytes)
  console.log('✓ Generated: samples/base/styling-demo.pdf')
}

generateStylingDemoPdf().catch(console.error)
