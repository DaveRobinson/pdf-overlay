import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { resolveResource } from '../src/resource-utils'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('resolveResource', () => {
  let testDir: string

  beforeAll(async () => {
    // Create temp directory for test files
    testDir = join(tmpdir(), `pdf-overlay-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })

    // Create test files
    await writeFile(join(testDir, 'test-font.ttf'), new Uint8Array([1, 2, 3, 4]))
    await writeFile(join(testDir, 'test-image.png'), new Uint8Array([0x89, 0x50, 0x4e, 0x47]))

    // Create subdirectory
    await mkdir(join(testDir, 'subdir'), { recursive: true })
    await writeFile(join(testDir, 'subdir', 'nested.ttf'), new Uint8Array([5, 6, 7, 8]))
  })

  afterAll(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true })
  })

  describe('Uint8Array pass-through', () => {
    it('should return Uint8Array unchanged', async () => {
      const data = new Uint8Array([1, 2, 3, 4])
      const result = await resolveResource(data, undefined, false)

      expect(result).toBe(data)
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should work regardless of basePath or allowRemoteUrls settings', async () => {
      const data = new Uint8Array([5, 6, 7])

      const result1 = await resolveResource(data, '/some/path', false)
      const result2 = await resolveResource(data, undefined, true)
      const result3 = await resolveResource(data, '/another/path', true)

      expect(result1).toBe(data)
      expect(result2).toBe(data)
      expect(result3).toBe(data)
    })
  })

  describe('File path resolution', () => {
    it('should read file from basePath', async () => {
      const result = await resolveResource('test-font.ttf', testDir, false)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should read nested files', async () => {
      const result = await resolveResource('subdir/nested.ttf', testDir, false)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(new Uint8Array([5, 6, 7, 8]))
    })

    it('should throw error when basePath not provided', async () => {
      await expect(
        resolveResource('test-font.ttf', undefined, false)
      ).rejects.toThrow('File paths require basePath to be configured')
    })

    it('should throw error when file does not exist', async () => {
      await expect(
        resolveResource('nonexistent.ttf', testDir, false)
      ).rejects.toThrow('Failed to read file')
    })

    it('should work with allowRemoteUrls setting (file access independent)', async () => {
      const result1 = await resolveResource('test-font.ttf', testDir, false)
      const result2 = await resolveResource('test-font.ttf', testDir, true)

      expect(result1).toEqual(new Uint8Array([1, 2, 3, 4]))
      expect(result2).toEqual(new Uint8Array([1, 2, 3, 4]))
    })
  })

  describe('Path traversal prevention', () => {
    it('should block ../ path traversal', async () => {
      await expect(
        resolveResource('../../../etc/passwd', testDir, false)
      ).rejects.toThrow('Path traversal detected')
    })

    it('should block absolute paths outside basePath', async () => {
      await expect(
        resolveResource('/etc/passwd', testDir, false)
      ).rejects.toThrow('Path traversal detected')
    })

    it('should block complex traversal attempts', async () => {
      await expect(
        resolveResource('subdir/../../outside.txt', testDir, false)
      ).rejects.toThrow('Path traversal detected')
    })

    it('should allow access to files in subdirectories', async () => {
      // This should work - it's within the basePath
      const result = await resolveResource('subdir/nested.ttf', testDir, false)
      expect(result).toEqual(new Uint8Array([5, 6, 7, 8]))
    })

    it('should normalize paths correctly', async () => {
      // These should all resolve to the same file
      const result1 = await resolveResource('./test-font.ttf', testDir, false)
      const result2 = await resolveResource('subdir/../test-font.ttf', testDir, false)

      expect(result1).toEqual(new Uint8Array([1, 2, 3, 4]))
      expect(result2).toEqual(new Uint8Array([1, 2, 3, 4]))
    })
  })

  describe('Remote URL handling', () => {
    it('should block remote URLs when allowRemoteUrls is false', async () => {
      await expect(
        resolveResource('https://example.com/font.ttf', undefined, false)
      ).rejects.toThrow('Remote URLs are not allowed')

      await expect(
        resolveResource('http://example.com/font.ttf', undefined, false)
      ).rejects.toThrow('Remote URLs are not allowed')
    })

    it('should block remote URLs even with basePath set', async () => {
      await expect(
        resolveResource('https://example.com/font.ttf', testDir, false)
      ).rejects.toThrow('Remote URLs are not allowed')
    })

    // Note: We don't test actual URL fetching to avoid network dependencies
    // Real URL fetching would be tested in integration tests with a local server
  })

  describe('Error messages', () => {
    it('should provide helpful error for missing basePath', async () => {
      try {
        await resolveResource('font.ttf', undefined, false)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('basePath')
        expect((error as Error).message).toContain('font.ttf')
      }
    })

    it('should provide helpful error for file read failure', async () => {
      try {
        await resolveResource('missing.ttf', testDir, false)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Failed to read file')
        expect((error as Error).message).toContain('missing.ttf')
      }
    })

    it('should provide helpful error for path traversal', async () => {
      try {
        await resolveResource('../../../etc/passwd', testDir, false)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Path traversal detected')
        expect((error as Error).message).toContain('etc/passwd')
      }
    })

    it('should provide helpful error for blocked remote URL', async () => {
      try {
        await resolveResource('https://example.com/font.ttf', testDir, false)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Remote URLs are not allowed')
        expect((error as Error).message).toContain('https://example.com/font.ttf')
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle empty file', async () => {
      const emptyPath = join(testDir, 'empty.txt')
      await writeFile(emptyPath, new Uint8Array([]))

      const result = await resolveResource('empty.txt', testDir, false)
      expect(result).toEqual(new Uint8Array([]))
    })

    it('should handle filenames with special characters', async () => {
      const specialPath = join(testDir, 'file-with-dashes_and_underscores.ttf')
      await writeFile(specialPath, new Uint8Array([9, 10]))

      const result = await resolveResource('file-with-dashes_and_underscores.ttf', testDir, false)
      expect(result).toEqual(new Uint8Array([9, 10]))
    })

    it('should handle case-sensitive paths', async () => {
      const casePath = join(testDir, 'CaseSensitive.ttf')
      await writeFile(casePath, new Uint8Array([11, 12]))

      const result = await resolveResource('CaseSensitive.ttf', testDir, false)
      expect(result).toEqual(new Uint8Array([11, 12]))
    })
  })
})
