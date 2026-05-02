/**
 * Feature: visual-style-system, Property 5: WCAG AA contrast ratio across all variants
 *
 * **Validates: Requirement 3.3**
 *
 * For every text/background token pair in each theme variant, the contrast
 * ratio must be ≥ 4.5:1 for WCAG AA compliance (normal text).
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// ─── Color utilities ───

function parseHexToRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function parseRgbaToRGB(rgba: string): [number, number, number] | null {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!match) return null
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
}

function parseColor(value: string): [number, number, number] | null {
  const trimmed = value.trim()
  if (trimmed.startsWith('#') && (trimmed.length === 7 || trimmed.length === 4)) {
    if (trimmed.length === 4) {
      const r = trimmed[1], g = trimmed[2], b = trimmed[3]
      return parseHexToRGB(`#${r}${r}${g}${g}${b}${b}`)
    }
    return parseHexToRGB(trimmed)
  }
  if (trimmed.startsWith('rgb')) {
    return parseRgbaToRGB(trimmed)
  }
  return null
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const l1 = relativeLuminance(...color1)
  const l2 = relativeLuminance(...color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ─── CSS parsing ───

function extractTokenValues(filePath: string, selector: string): Record<string, string> {
  const fullPath = path.resolve(process.cwd(), filePath)
  const content = fs.readFileSync(fullPath, 'utf-8')
  const tokens: Record<string, string> = {}

  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockRegex = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'gs')

  let match: RegExpExecArray | null
  while ((match = blockRegex.exec(content)) !== null) {
    const propRegex = /(--[\w-]+)\s*:\s*([^;]+);/g
    let propMatch: RegExpExecArray | null
    while ((propMatch = propRegex.exec(match[1])) !== null) {
      tokens[propMatch[1]] = propMatch[2].trim()
    }
  }
  return tokens
}

// ─── Build variant data ───

interface VariantData {
  name: string
  tokens: Record<string, string>
}

const variantsData: VariantData[] = [
  { name: 'Classic Light', tokens: extractTokenValues('src/styles/tokens-base.css', ':root') },
  { name: 'Classic Dark', tokens: extractTokenValues('src/styles/tokens-classic.css', '.dark') },
  { name: 'Retro Light', tokens: extractTokenValues('src/styles/tokens-retrofuturista.css', '[data-visual-theme="retrofuturista"]') },
]

// Retro dark: merge both selector patterns
const retroDarkFile = 'src/styles/tokens-retrofuturista.css'
const rd1 = extractTokenValues(retroDarkFile, '[data-visual-theme="retrofuturista"].dark')
const rd2 = extractTokenValues(retroDarkFile, '.dark[data-visual-theme="retrofuturista"]')
variantsData.push({ name: 'Retro Dark', tokens: { ...rd1, ...rd2 } })

// Text/background pairs to check
const TEXT_BG_PAIRS = [
  { text: '--color-text-primary', bg: '--color-bg-base' },
  { text: '--color-text-primary', bg: '--color-bg-surface' },
  { text: '--color-text-secondary', bg: '--color-bg-base' },
  { text: '--color-text-secondary', bg: '--color-bg-surface' },
] as const

// Build all testable combinations
interface ContrastCase {
  variant: string
  textToken: string
  bgToken: string
  textColor: [number, number, number]
  bgColor: [number, number, number]
}

const contrastCases: ContrastCase[] = []

for (const variant of variantsData) {
  for (const pair of TEXT_BG_PAIRS) {
    const textVal = variant.tokens[pair.text]
    const bgVal = variant.tokens[pair.bg]
    if (!textVal || !bgVal) continue

    const textColor = parseColor(textVal)
    const bgColor = parseColor(bgVal)
    if (!textColor || !bgColor) continue

    contrastCases.push({
      variant: variant.name,
      textToken: pair.text,
      bgToken: pair.bg,
      textColor,
      bgColor,
    })
  }
}

describe('Property 5: WCAG AA contrast ratio across all theme variants', () => {
  /**
   * Feature: visual-style-system, Property 5: Ratio de contraste WCAG AA en todas las variantes
   *
   * For any text/background pair in any variant, contrast ratio must be ≥ 4.5:1.
   */
  it('all text/background pairs meet WCAG AA contrast ratio (≥ 4.5:1)', () => {
    expect(contrastCases.length).toBeGreaterThan(0)

    const caseArb = fc.constantFrom(...contrastCases)

    fc.assert(
      fc.property(caseArb, (c) => {
        const ratio = contrastRatio(c.textColor, c.bgColor)
        return ratio >= 4.5
      }),
      { numRuns: 100, verbose: true },
    )
  })
})
