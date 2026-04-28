/**
 * Feature: visual-style-system, Property 2: Absence of !important in theme files
 *
 * **Validates: Requirement 1.3**
 *
 * Verifies that no declaration in the 3 theme token files contains `!important`.
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
 * Extract all non-comment lines from a CSS file.
 */
function extractLines(filePath: string): Array<{ file: string; lineNum: number; text: string }> {
  const fullPath = path.resolve(process.cwd(), filePath)
  const content = fs.readFileSync(fullPath, 'utf-8')
  const results: Array<{ file: string; lineNum: number; text: string }> = []

  content.split('\n').forEach((raw, i) => {
    const text = raw.trim()
    if (!text || text.startsWith('/*') || text.startsWith('*') || text.endsWith('*/') || text.startsWith('//')) return
    results.push({ file: filePath, lineNum: i + 1, text })
  })

  return results
}

const allLines = THEME_FILES.flatMap(f => extractLines(f))

describe('Property 2: Absence of !important in theme files', () => {
  /**
   * Feature: visual-style-system, Property 2: Absence of !important in theme files
   *
   * For any line in any theme file, it must not contain !important.
   */
  it('no line in theme files contains !important', () => {
    expect(allLines.length).toBeGreaterThan(0)

    const lineArb = fc.constantFrom(...allLines)

    fc.assert(
      fc.property(lineArb, (line) => {
        return !line.text.includes('!important')
      }),
      { numRuns: 100, verbose: true },
    )
  })
})
