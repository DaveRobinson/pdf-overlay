import { rgb, cmyk, grayscale } from 'pdf-lib'
import type { Color } from 'pdf-lib'
import type { ColourSpec } from './types'

/**
 * Parse a ColourSpec to pdf-lib's Color type
 */
export function parseColour(colourSpec: ColourSpec): Color {
  if (typeof colourSpec === 'string') {
    // Handle hex colours
    if (colourSpec.startsWith('#')) {
      let hex = colourSpec.slice(1)

      // Expand shorthand (#F00 -> #FF0000)
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
      }

      if (hex.length === 6) {
        // Validate hex format
        if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
          throw new Error(`Invalid colour string: ${colourSpec}. Use hex format like "#FF0000" or "#F00"`)
        }

        const r = parseInt(hex.slice(0, 2), 16) / 255
        const g = parseInt(hex.slice(2, 4), 16) / 255
        const b = parseInt(hex.slice(4, 6), 16) / 255
        return rgb(r, g, b)
      }
    }

    throw new Error(`Invalid colour string: ${colourSpec}. Use hex format like "#FF0000" or "#F00"`)
  }

  // Handle object-based colour specs
  switch (colourSpec.type) {
    case 'rgb':
      return rgb(colourSpec.r, colourSpec.g, colourSpec.b)
    case 'cmyk':
      return cmyk(colourSpec.c, colourSpec.m, colourSpec.y, colourSpec.k)
    case 'grey':
      return grayscale(colourSpec.grey)
  }
}
