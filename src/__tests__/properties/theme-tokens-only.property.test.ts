/**
 * Feature: visual-style-system, Property 1: Theme files contain exclusively token definitions
 *
 * **Validates: Requirements 1.2, 5.1**
 *
 * Parses `tokens-base.css`, `tokens-classic.css`, `tokens-retrofuturista.css` and
 * verifies that within theme selectors only custom property declarations (`--*: value`)
 * exist — no rules targeting component class selectors.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

const THEME_FILES = [
  'src/styles/tokens-base.css',
  'src/styles/tokens-classic.css',
  'src/styles/tokens-retrofuturista.css',
] as const

/**
 * Extract all declaration lines inside selector blocks from a CSS file.
 * Returns an array of { file, selector, line } for each non-empty,
 * non-comment line inside a block.
 */
function extractDeclarations(filePath: string): Array<{ file: string; selector: string; line: string }> {
  const fullPath = path.resolve(process.cwd(), filePath)
  const content = fs.readFileSync(fullPath, 'utf-8')
  const results: Array<{ file: string; selector: string; line: string }> = []

  // Match selector { ... } blocks (handles nested selectors via non-greedy)
  const blockRegex = /([^{}]+?)\s*\{([^}]*)\}/gs
  let match: RegExpExecArray | null

  while ((match = blockRegex.exec(content)) !== null) {
    const selector = match[1].trim()
    const blockContent = match[2]

    // Skip comment-only or internal variable blocks
    const lines = blockContent.split('\n')
    for (const raw of lines) {
      const line = raw.trim()
      // Skip empty lines, comments, and section dividers
      if (!line || line.startsWith('/*') || line.startsWith('*') || line.startsWith('//')) continue
      if (line.startsWith('/* ') || line.endsWith('*/')) continue

      results.push({ file: filePath, selector, line })
    }
  }

  return results
}

// Collect all declarations from all theme files
const allDeclarations = THEME_FILES.flatMap(f => extractDeclarations(f))

describe('Property 1: Theme files contain exclusively token definitions', () => {
  /**
   * Feature: visual-style-system, Property 1: Theme files contain exclusively token definitions
   *
   * For any declaration line inside a theme file selector block,
   * it must be a custom property declaration (starts with --).
   */
  it('all declarations in theme files are custom property definitions', () => {
    expect(allDeclarations.length).toBeGreaterThan(0)

    const declArb = fc.constantFrom(...allDeclarations)

    fc.assert(
      fc.property(declArb, (decl) => {
        // A valid line is a custom property: --something: value;
        const isCustomProp = /^\s*--[\w-]+\s*:/.test(decl.line)
        if (!isCustomProp) {
          return false
        }
        return true
      }),
      { numRuns: 100, verbose: true },
    )
  })

  it('no component class selectors exist in theme files', () => {
    // Component selectors that must NOT appear
    const FORBIDDEN_SELECTORS = [
      '.dashboard-card', '.habit-card', '.todo-item-card',
      '.sidebar-logo-bg', '#main-sidebar', '.checklist-',
    ]

    for (const file of THEME_FILES) {
      const fullPath = path.resolve(process.cwd(), file)
      const content = fs.readFileSync(fullPath, 'utf-8')

      for (const sel of FORBIDDEN_SELECTORS) {
        expect(content).not.toContain(sel)
      }
    }
  })
})
