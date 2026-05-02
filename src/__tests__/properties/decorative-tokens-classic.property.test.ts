/**
 * Feature: visual-style-system, Property 6: Decorative tokens are transparent in the classic style
 *
 * **Validates: Requirement 7.4**
 *
 * Verifies that decorative tokens (`--deco-grid-line`, `--deco-sidebar-top-line`,
 * `--deco-logo-shadow`) are `transparent` or `none` in both `:root` (Classic Light)
 * and `.dark` (Classic Dark) selectors, ensuring retrofuturista decorative elements
 * do not appear in the classic style.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// Decorative tokens that must be transparent/none in classic
const DECORATIVE_TOKENS = [
  '--deco-grid-line',
  '--deco-sidebar-top-line',
  '--deco-logo-shadow',
] as const

// CSS selectors representing classic theme variants
const CLASSIC_SELECTORS = [':root', '.dark'] as const

// Files to parse
const CSS_FILES = {
  ':root': 'src/styles/tokens-base.css',
  '.dark': 'src/styles/tokens-classic.css',
} as const

// Values considered invisible/transparent
const INVISIBLE_VALUES = ['transparent', 'none']

/**
 * Parse a CSS file and extract custom property values from a given selector block.
 * Returns a map of property name → value.
 */
function parseCSSTokens(
  cssContent: string,
  selector: string,
): Record<string, string> {
  const tokens: Record<string, string> = {}

  // Build regex to match the selector block
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockRegex = new RegExp(
    `${escapedSelector}\\s*\\{([^}]*)\\}`,
    'gs',
  )

  let blockMatch: RegExpExecArray | null
  while ((blockMatch = blockRegex.exec(cssContent)) !== null) {
    const blockContent = blockMatch[1]
    // Extract custom property declarations
    const propRegex = /(--[\w-]+)\s*:\s*([^;]+);/g
    let propMatch: RegExpExecArray | null
    while ((propMatch = propRegex.exec(blockContent)) !== null) {
      tokens[propMatch[1]] = propMatch[2].trim()
    }
  }

  return tokens
}

// Read and parse CSS files once
const parsedTokens: Record<string, Record<string, string>> = {}

for (const [selector, filePath] of Object.entries(CSS_FILES)) {
  const fullPath = path.resolve(process.cwd(), filePath)
  const content = fs.readFileSync(fullPath, 'utf-8')
  parsedTokens[selector] = parseCSSTokens(content, selector)
}

describe('Property 6: Decorative tokens are transparent in the classic style', () => {
  /**
   * Property-based test: for any combination of (decorative token, classic selector),
   * the token value must be `transparent` or `none`.
   *
   * **Validates: Requirement 7.4**
   */
  it('all decorative tokens are transparent/none in classic theme variants', () => {
    const tokenArb = fc.constantFrom(...DECORATIVE_TOKENS)
    const selectorArb = fc.constantFrom(...CLASSIC_SELECTORS)

    fc.assert(
      fc.property(tokenArb, selectorArb, (token, selector) => {
        const tokens = parsedTokens[selector]
        expect(tokens).toBeDefined()

        const value = tokens[token]
        expect(value).toBeDefined()

        return INVISIBLE_VALUES.includes(value)
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    )
  })
})
