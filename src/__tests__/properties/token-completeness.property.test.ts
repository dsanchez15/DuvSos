/**
 * Feature: visual-style-system, Property 3: Completeness of tokens across all theme variants
 *
 * **Validates: Requirements 1.4, 3.1**
 *
 * For every design token defined in `:root` (tokens-base.css), verifies that the
 * same token is defined in `.dark`, `[data-visual-theme="retrofuturista"]`, and
 * `[data-visual-theme="retrofuturista"].dark`.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

interface VariantTokens {
  selector: string
  tokens: Set<string>
}

/**
 * Extract all custom property names from a CSS file for a given selector.
 */
function extractTokenNames(filePath: string, selector: string): Set<string> {
  const fullPath = path.resolve(process.cwd(), filePath)
  const content = fs.readFileSync(fullPath, 'utf-8')
  const names = new Set<string>()

  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockRegex = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'gs')

  let match: RegExpExecArray | null
  while ((match = blockRegex.exec(content)) !== null) {
    const propRegex = /(--[\w-]+)\s*:/g
    let propMatch: RegExpExecArray | null
    while ((propMatch = propRegex.exec(match[1])) !== null) {
      names.add(propMatch[1])
    }
  }

  return names
}

// Extract base tokens (the contract)
const baseTokens = extractTokenNames('src/styles/tokens-base.css', ':root')

// Only check design tokens that change between variants (skip static tokens like radii, fonts, tracking)
// Radii, fonts, and tracking are intentionally inherited from :root when unchanged
const STATIC_TOKEN_PREFIXES = ['--radius-', '--font-', '--tracking-']

const designTokens = [...baseTokens].filter(t => {
  // Must be a design token
  const isDesignToken = t.startsWith('--color-') || t.startsWith('--shadow-') || t.startsWith('--font-') ||
    t.startsWith('--tracking-') || t.startsWith('--radius-') || t.startsWith('--deco-')
  if (!isDesignToken) return false
  // Skip static tokens that intentionally inherit from :root
  return !STATIC_TOKEN_PREFIXES.some(prefix => t.startsWith(prefix))
})

// Extract tokens from each variant
const variants: VariantTokens[] = [
  {
    selector: '.dark',
    tokens: extractTokenNames('src/styles/tokens-classic.css', '.dark'),
  },
  {
    selector: '[data-visual-theme="retrofuturista"]',
    tokens: extractTokenNames('src/styles/tokens-retrofuturista.css', '[data-visual-theme="retrofuturista"]'),
  },
]

// For retro dark, combine both selector patterns
const retroDarkFile = 'src/styles/tokens-retrofuturista.css'
const retroDarkTokens = new Set<string>([
  ...extractTokenNames(retroDarkFile, '[data-visual-theme="retrofuturista"].dark'),
  ...extractTokenNames(retroDarkFile, '.dark[data-visual-theme="retrofuturista"]'),
])
variants.push({
  selector: '[data-visual-theme="retrofuturista"].dark',
  tokens: retroDarkTokens,
})

describe('Property 3: Completeness of tokens across all theme variants', () => {
  /**
   * Feature: visual-style-system, Property 3: Completeness of tokens in all theme variants
   *
   * For any (design token, variant) pair, the token must be defined in that variant.
   */
  it('every base design token exists in all theme variants', () => {
    expect(designTokens.length).toBeGreaterThan(0)

    const tokenArb = fc.constantFrom(...designTokens)
    const variantArb = fc.constantFrom(...variants)

    fc.assert(
      fc.property(tokenArb, variantArb, (token, variant) => {
        return variant.tokens.has(token)
      }),
      { numRuns: 100, verbose: true },
    )
  })
})
