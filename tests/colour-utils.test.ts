import { describe, it, expect } from 'vitest'
import { parseColour } from '../src/colour-utils'

describe('parseColour', () => {
  describe('hex colour strings', () => {
    it('should parse 6-digit hex codes', () => {
      const result = parseColour('#FF0000')
      expect(result).toEqual({
        type: 'RGB',
        red: 1,
        green: 0,
        blue: 0,
      })
    })

    it('should parse 3-digit shorthand hex codes', () => {
      const result = parseColour('#F00')
      expect(result).toEqual({
        type: 'RGB',
        red: 1,
        green: 0,
        blue: 0,
      })
    })

    it('should parse lowercase hex codes', () => {
      const result = parseColour('#00ff00')
      expect(result).toEqual({
        type: 'RGB',
        red: 0,
        green: 1,
        blue: 0,
      })
    })

    it('should parse mixed case hex codes', () => {
      const result = parseColour('#0000Ff')
      expect(result).toEqual({
        type: 'RGB',
        red: 0,
        green: 0,
        blue: 1,
      })
    })

    it('should handle black (#000)', () => {
      const result = parseColour('#000')
      expect(result).toEqual({
        type: 'RGB',
        red: 0,
        green: 0,
        blue: 0,
      })
    })

    it('should handle white (#FFF)', () => {
      const result = parseColour('#FFF')
      expect(result).toEqual({
        type: 'RGB',
        red: 1,
        green: 1,
        blue: 1,
      })
    })

    it('should handle mid-range colours', () => {
      const result = parseColour('#808080')
      expect(result).toEqual({
        type: 'RGB',
        red: expect.closeTo(0.5019607843137255, 0.001),
        green: expect.closeTo(0.5019607843137255, 0.001),
        blue: expect.closeTo(0.5019607843137255, 0.001),
      })
    })

    it('should throw error for invalid hex format', () => {
      expect(() => parseColour('#GG0000')).toThrow('Invalid colour string')
    })

    it('should throw error for hex without #', () => {
      expect(() => parseColour('FF0000')).toThrow('Invalid colour string')
    })

    it('should throw error for wrong length hex', () => {
      expect(() => parseColour('#FF00')).toThrow('Invalid colour string')
    })
  })

  describe('RGB colour objects', () => {
    it('should parse RGB colour objects', () => {
      const result = parseColour({
        type: 'rgb',
        r: 1,
        g: 0.5,
        b: 0.25,
      })
      expect(result).toEqual({
        type: 'RGB',
        red: 1,
        green: 0.5,
        blue: 0.25,
      })
    })

    it('should handle RGB with all zeros', () => {
      const result = parseColour({
        type: 'rgb',
        r: 0,
        g: 0,
        b: 0,
      })
      expect(result).toEqual({
        type: 'RGB',
        red: 0,
        green: 0,
        blue: 0,
      })
    })

    it('should handle RGB with all ones', () => {
      const result = parseColour({
        type: 'rgb',
        r: 1,
        g: 1,
        b: 1,
      })
      expect(result).toEqual({
        type: 'RGB',
        red: 1,
        green: 1,
        blue: 1,
      })
    })
  })

  describe('CMYK colour objects', () => {
    it('should parse CMYK colour objects', () => {
      const result = parseColour({
        type: 'cmyk',
        c: 1,
        m: 0,
        y: 0,
        k: 0,
      })
      expect(result).toEqual({
        type: 'CMYK',
        cyan: 1,
        magenta: 0,
        yellow: 0,
        key: 0,
      })
    })

    it('should handle black in CMYK', () => {
      const result = parseColour({
        type: 'cmyk',
        c: 0,
        m: 0,
        y: 0,
        k: 1,
      })
      expect(result).toEqual({
        type: 'CMYK',
        cyan: 0,
        magenta: 0,
        yellow: 0,
        key: 1,
      })
    })
  })

  describe('grey colour objects', () => {
    it('should parse grey colour objects', () => {
      const result = parseColour({
        type: 'grey',
        grey: 0.5,
      })
      expect(result).toEqual({
        type: 'Grayscale',
        gray: 0.5,
      })
    })

    it('should handle black (grey: 0)', () => {
      const result = parseColour({
        type: 'grey',
        grey: 0,
      })
      expect(result).toEqual({
        type: 'Grayscale',
        gray: 0,
      })
    })

    it('should handle white (grey: 1)', () => {
      const result = parseColour({
        type: 'grey',
        grey: 1,
      })
      expect(result).toEqual({
        type: 'Grayscale',
        gray: 1,
      })
    })
  })
})
