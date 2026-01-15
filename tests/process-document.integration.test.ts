import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { readFile, writeFile, unlink, mkdir, rmdir } from 'fs/promises'
import { join } from 'path'
import { processDocument, processDocumentFile } from '../src/process-document'
import { resolveResource } from '../src/resource-utils'
import type { DocumentRules } from '../src/types'

const FIXTURES_DIR = join(__dirname, 'fixtures')
const TEMP_DIR = join(__dirname, 'temp')

// Minimal 1x1 white PNG (67 bytes)
const TINY_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
  0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
  0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59,
  0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
  0x44, 0xae, 0x42, 0x60, 0x82
])

// Minimal 1x1 white JPEG (134 bytes)
const TINY_JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
  0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c,
  0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d,
  0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
  0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
  0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
  0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
  0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
  0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
  0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
  0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
  0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
  0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1,
  0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
  0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a,
  0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
  0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
  0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55,
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
  0x3f, 0x00, 0x7f, 0xff, 0xd9
])

// Invalid image (not PNG or JPEG)
const INVALID_IMAGE = new Uint8Array([0x00, 0x01, 0x02, 0x03])

/**
 * Helper to create a minimal in-memory PDF
 */
async function createTestPdf(pageCount = 1): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage()
  }
  return await pdfDoc.save()
}

describe('processDocument integration', () => {
  describe('text processing', () => {
    it('should process a simple text rule', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            body: { type: 'standard', family: StandardFonts.Helvetica }
          }
        },
        processingRules: [{
          type: 'text',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: { content: 'Hello World', fontName: 'body' }
        }]
      }

      const result = await processDocument(pdfBytes, rules)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(pdfBytes.length)
    })

    it('should process text with styling options', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            body: { type: 'standard', family: StandardFonts.Helvetica }
          }
        },
        processingRules: [{
          type: 'text',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: {
            content: 'Styled text',
            fontName: 'body',
            fontSize: 24,
            colour: '#FF0000',
            opacity: 0.8
          }
        }]
      }

      const result = await processDocument(pdfBytes, rules)

      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should process text with alignment and bounds', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            body: { type: 'standard', family: StandardFonts.Helvetica }
          }
        },
        processingRules: [{
          type: 'text',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: {
            content: 'Centered text',
            fontName: 'body',
            align: 'center',
            verticalAlign: 'middle',
            bounds: { width: 200, height: 100 }
          }
        }]
      }

      const result = await processDocument(pdfBytes, rules)

      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should process text using defaults', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            body: { type: 'standard', family: StandardFonts.Helvetica }
          },
          defaults: {
            fontName: 'body',
            fontSize: 12,
            colour: '#000000',
            lineHeight: 1.2
          }
        },
        processingRules: [{
          type: 'text',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: { content: 'Using defaults' }
        }]
      }

      const result = await processDocument(pdfBytes, rules)

      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should process text without font (fallback positioning)', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [{
          type: 'text',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: { content: 'No font specified' }
        }]
      }

      const result = await processDocument(pdfBytes, rules)

      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should process multiple text rules on same page', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            body: { type: 'standard', family: StandardFonts.Helvetica }
          }
        },
        processingRules: [
          {
            type: 'text',
            page: { type: 'first' },
            position: { x: 50, y: 750 },
            element: { content: 'First line', fontName: 'body' }
          },
          {
            type: 'text',
            page: { type: 'first' },
            position: { x: 50, y: 700 },
            element: { content: 'Second line', fontName: 'body' }
          }
        ]
      }

      const result = await processDocument(pdfBytes, rules)

      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should process text rules across multiple pages', async () => {
      const pdfBytes = await createTestPdf(3)
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            body: { type: 'standard', family: StandardFonts.Helvetica }
          }
        },
        processingRules: [{
          type: 'text',
          page: { type: 'all' },
          position: { x: 50, y: 750 },
          element: { content: 'Header on all pages', fontName: 'body' }
        }]
      }

      const result = await processDocument(pdfBytes, rules)

      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('image processing', () => {
    it('should embed PNG image', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [{
          type: 'image',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: { name: 'logo', width: 100, height: 100 }
        }]
      }

      const result = await processDocument(pdfBytes, rules, {
        resources: { images: { logo: TINY_PNG } }
      })

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(pdfBytes.length)
    })

    it('should embed JPEG image', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [{
          type: 'image',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: { name: 'photo', width: 100, height: 100 }
        }]
      }

      const result = await processDocument(pdfBytes, rules, {
        resources: { images: { photo: TINY_JPEG } }
      })

      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should embed image on multiple pages', async () => {
      const pdfBytes = await createTestPdf(3)
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [{
          type: 'image',
          page: { type: 'all' },
          position: { x: 50, y: 750 },
          element: { name: 'watermark', width: 50, height: 50 }
        }]
      }

      const result = await processDocument(pdfBytes, rules, {
        resources: { images: { watermark: TINY_PNG } }
      })

      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should throw error for unsupported image format', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [{
          type: 'image',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: { name: 'invalid' }
        }]
      }

      await expect(
        processDocument(pdfBytes, rules, {
          resources: { images: { invalid: INVALID_IMAGE } }
        })
      ).rejects.toThrow('Unsupported image format')
    })

    it('should throw error when image not in resources', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {},
        processingRules: [{
          type: 'image',
          page: { type: 'first' },
          position: { x: 50, y: 750 },
          element: { name: 'missing' }
        }]
      }

      await expect(processDocument(pdfBytes, rules)).rejects.toThrow(
        "Image 'missing' not found in resources"
      )
    })
  })

  describe('mixed content', () => {
    it('should process text and images together', async () => {
      const pdfBytes = await createTestPdf()
      const rules: DocumentRules = {
        documentMeta: {
          fonts: {
            body: { type: 'standard', family: StandardFonts.Helvetica }
          }
        },
        processingRules: [
          {
            type: 'image',
            page: { type: 'first' },
            position: { x: 50, y: 750 },
            element: { name: 'logo', width: 100, height: 50 }
          },
          {
            type: 'text',
            page: { type: 'first' },
            position: { x: 160, y: 770 },
            element: { content: 'Company Name', fontName: 'body', fontSize: 20 }
          }
        ]
      }

      const result = await processDocument(pdfBytes, rules, {
        resources: { images: { logo: TINY_PNG } }
      })

      expect(result).toBeInstanceOf(Uint8Array)
    })
  })
})

describe('resolveResource fetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fetch remote resource successfully', async () => {
    const mockData = TINY_PNG

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockData.buffer)
    } as Response)

    const result = await resolveResource('https://example.com/image.png', undefined, true)

    expect(fetch).toHaveBeenCalledWith('https://example.com/image.png')
    expect(result).toEqual(mockData)
  })

  it('should throw error on HTTP failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    } as Response)

    await expect(
      resolveResource('https://example.com/missing.png', undefined, true)
    ).rejects.toThrow('HTTP 404: Not Found')
  })

  it('should throw error on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    await expect(
      resolveResource('https://example.com/image.png', undefined, true)
    ).rejects.toThrow('Failed to fetch resource')
  })

  it('should handle http:// URLs', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(TINY_PNG.buffer)
    } as Response)

    await resolveResource('http://example.com/image.png', undefined, true)

    expect(fetch).toHaveBeenCalledWith('http://example.com/image.png')
  })
})

describe('processDocumentFile', () => {
  let testPdfPath: string
  let outputPdfPath: string

  beforeAll(async () => {
    // Create temp directory
    await mkdir(TEMP_DIR, { recursive: true })

    // Generate a test PDF file
    const pdfDoc = await PDFDocument.create()
    pdfDoc.addPage()
    const pdfBytes = await pdfDoc.save()

    testPdfPath = join(TEMP_DIR, 'test-input.pdf')
    outputPdfPath = join(TEMP_DIR, 'test-output.pdf')
    await writeFile(testPdfPath, pdfBytes)
  })

  afterAll(async () => {
    // Clean up temp files
    try {
      await unlink(testPdfPath)
    } catch { /* ignore */ }
    try {
      await unlink(outputPdfPath)
    } catch { /* ignore */ }
    try {
      await rmdir(TEMP_DIR)
    } catch { /* ignore */ }
  })

  it('should process PDF file and write output', async () => {
    const rules: DocumentRules = {
      documentMeta: {
        fonts: {
          body: { type: 'standard', family: StandardFonts.Helvetica }
        }
      },
      processingRules: [{
        type: 'text',
        page: { type: 'first' },
        position: { x: 50, y: 750 },
        element: { content: 'File I/O test', fontName: 'body' }
      }]
    }

    await processDocumentFile(testPdfPath, rules, outputPdfPath)

    // Verify output file was created
    const outputBytes = await readFile(outputPdfPath)
    expect(outputBytes.length).toBeGreaterThan(0)

    // Verify it's a valid PDF
    const pdfDoc = await PDFDocument.load(outputBytes)
    expect(pdfDoc.getPageCount()).toBe(1)
  })

  it('should process PDF file with image resources using basePaths', async () => {
    const rules: DocumentRules = {
      documentMeta: {},
      processingRules: [{
        type: 'image',
        page: { type: 'first' },
        position: { x: 50, y: 750 },
        element: { name: 'test-image', width: 50, height: 50 }
      }]
    }

    // Write a test image to temp dir
    const testImagePath = join(TEMP_DIR, 'test-image.png')
    await writeFile(testImagePath, TINY_PNG)

    try {
      await processDocumentFile(testPdfPath, rules, outputPdfPath, {
        basePaths: { images: TEMP_DIR },
        resources: { images: { 'test-image': 'test-image.png' } }
      })

      const outputBytes = await readFile(outputPdfPath)
      expect(outputBytes.length).toBeGreaterThan(0)
    } finally {
      await unlink(testImagePath)
    }
  })
})

describe('custom font embedding', () => {
  it('should embed custom TTF font from Uint8Array', async () => {
    const pdfBytes = await createTestPdf()
    const fontBytes = await readFile(join(FIXTURES_DIR, 'Roboto-Regular.ttf'))

    const rules: DocumentRules = {
      documentMeta: {
        fonts: {
          roboto: { type: 'custom', family: 'Roboto' }
        }
      },
      processingRules: [{
        type: 'text',
        page: { type: 'first' },
        position: { x: 50, y: 750 },
        element: { content: 'Custom font test', fontName: 'roboto' }
      }]
    }

    const result = await processDocument(pdfBytes, rules, {
      resources: { fonts: { roboto: new Uint8Array(fontBytes) } }
    })

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(pdfBytes.length)
  })

  it('should embed custom font using basePaths', async () => {
    const pdfBytes = await createTestPdf()

    const rules: DocumentRules = {
      documentMeta: {
        fonts: {
          roboto: { type: 'custom', family: 'Roboto' }
        }
      },
      processingRules: [{
        type: 'text',
        page: { type: 'first' },
        position: { x: 50, y: 750 },
        element: { content: 'Custom font from file', fontName: 'roboto' }
      }]
    }

    const result = await processDocument(pdfBytes, rules, {
      basePaths: { fonts: FIXTURES_DIR },
      resources: { fonts: { roboto: 'Roboto-Regular.ttf' } }
    })

    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('should throw error when custom font not in resources', async () => {
    const pdfBytes = await createTestPdf()

    const rules: DocumentRules = {
      documentMeta: {
        fonts: {
          missing: { type: 'custom', family: 'Missing' }
        }
      },
      processingRules: [{
        type: 'text',
        page: { type: 'first' },
        position: { x: 50, y: 750 },
        element: { content: 'Test', fontName: 'missing' }
      }]
    }

    await expect(processDocument(pdfBytes, rules)).rejects.toThrow(
      "Custom font 'missing' not found in resources"
    )
  })

  it('should use custom font with styling options', async () => {
    const pdfBytes = await createTestPdf()
    const fontBytes = await readFile(join(FIXTURES_DIR, 'Roboto-Regular.ttf'))

    const rules: DocumentRules = {
      documentMeta: {
        fonts: {
          roboto: { type: 'custom', family: 'Roboto' }
        }
      },
      processingRules: [{
        type: 'text',
        page: { type: 'first' },
        position: { x: 50, y: 750 },
        element: {
          content: 'Styled custom font',
          fontName: 'roboto',
          fontSize: 24,
          colour: '#336699',
          align: 'center',
          bounds: { width: 200 }
        }
      }]
    }

    const result = await processDocument(pdfBytes, rules, {
      resources: { fonts: { roboto: new Uint8Array(fontBytes) } }
    })

    expect(result).toBeInstanceOf(Uint8Array)
  })
})
