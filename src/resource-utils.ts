import { resolve, relative } from 'path'
import { readFile } from 'fs/promises'

/**
 * Resolve a resource value to Uint8Array
 *
 * @param value - Either raw data (Uint8Array) or a reference (URL/file path string)
 * @param basePath - Base path for resolving relative file paths
 * @param allowRemoteUrls - Whether to allow fetching from remote URLs
 * @returns The resource as Uint8Array
 */
export async function resolveResource(
  value: string | Uint8Array,
  basePath: string | undefined,
  allowRemoteUrls: boolean
): Promise<Uint8Array> {
  // Already have raw data - return as-is
  if (value instanceof Uint8Array) {
    return value
  }

  // Value is a string - could be URL or file path

  // Check if it's a remote URL
  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (!allowRemoteUrls) {
      throw new Error(
        `Remote URLs are not allowed: ${value}\n` +
        'Enable allowRemoteUrls option or provide data as Uint8Array.'
      )
    }
    return await fetchUrl(value)
  }

  // It's a file path - requires basePath
  if (!basePath) {
    throw new Error(
      `File paths require basePath to be configured: ${value}\n` +
      'Provide basePath in options or pass data as Uint8Array.'
    )
  }

  // Resolve path relative to base
  const fullPath = resolve(basePath, value)

  // Security check: ensure resolved path is within basePath
  const relativePath = relative(basePath, fullPath)
  if (relativePath.startsWith('..') || relativePath === '') {
    throw new Error(
      `Path traversal detected: "${value}" resolves outside base path "${basePath}"`
    )
  }

  // Read and return file contents
  try {
    const buffer = await readFile(fullPath)
    // Convert Buffer to Uint8Array (Buffer is a subclass but we want pure Uint8Array for cross-platform consistency)
    return new Uint8Array(buffer)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to read file: ${fullPath}\n` +
      `Base path: ${basePath}\n` +
      `Requested: ${value}\n` +
      `Error: ${message}`
    )
  }
}

/**
 * Fetch a resource from a remote URL
 *
 * @param url - The URL to fetch from
 * @returns The resource as Uint8Array
 */
async function fetchUrl(url: string): Promise<Uint8Array> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to fetch resource from ${url}: ${message}`
    )
  }
}
