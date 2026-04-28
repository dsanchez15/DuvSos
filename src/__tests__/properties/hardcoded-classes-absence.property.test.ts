/**
 * Feature: visual-style-system, Property 4: Absence of hardcoded Tailwind color classes in components
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6, 4.1, 4.3, 4.5
 *
 * Verifies that migrated core components (SettingCard.tsx, Sidebar.tsx, Toast.tsx)
 * and pages (login/page.tsx, settings/page.tsx) do NOT contain hardcoded Tailwind
 * color classes in className attributes.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// Component files to validate
const COMPONENT_FILES = [
  'src/components/SettingCard.tsx',
  'src/components/Sidebar.tsx',
  'src/components/Toast.tsx',
] as const

// Forbidden regex patterns for hardcoded Tailwind color classes
const FORBIDDEN_PATTERNS: { pattern: RegExp; description: string }[] = [
  { pattern: /\bbg-white\b/, description: 'bg-white' },
  { pattern: /\bbg-slate-\d+/, description: 'bg-slate-*' },
  { pattern: /\bdark:bg-slate-\d+/, description: 'dark:bg-slate-*' },
  { pattern: /\btext-slate-\d+/, description: 'text-slate-*' },
  { pattern: /\bdark:text-slate-\d+/, description: 'dark:text-slate-*' },
  { pattern: /\bborder-slate-\d+/, description: 'border-slate-*' },
  { pattern: /\bdark:border-slate-\d+/, description: 'dark:border-slate-*' },
]

// Read component files once
const componentContents: Record<string, string> = {}
for (const filePath of COMPONENT_FILES) {
  const fullPath = path.resolve(process.cwd(), filePath)
  componentContents[filePath] = fs.readFileSync(fullPath, 'utf-8')
}

// Extract className attribute values from component source
function extractClassNameValues(source: string): string[] {
  const classNameValues: string[] = []
  // Match className="..." and className={`...`} patterns
  const staticPattern = /className="([^"]*)"/g
  const templatePattern = /className=\{`([^`]*)`\}/g
  const concatPattern = /className=\{([^}]+)\}/g

  let match: RegExpExecArray | null
  while ((match = staticPattern.exec(source)) !== null) {
    classNameValues.push(match[1])
  }
  while ((match = templatePattern.exec(source)) !== null) {
    classNameValues.push(match[1])
  }
  while ((match = concatPattern.exec(source)) !== null) {
    classNameValues.push(match[1])
  }
  return classNameValues
}

describe('Property 4: Absence of hardcoded Tailwind color classes in components', () => {
  /**
   * Property-based test: for any combination of (component, forbidden pattern),
   * the className attributes in the component must not contain the forbidden pattern.
   *
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6**
   */
  it('no migrated core component contains forbidden hardcoded Tailwind color classes in className attributes', () => {
    // Arbitraries: pick a random component file and a random forbidden pattern
    const componentArb = fc.constantFrom(...COMPONENT_FILES)
    const patternIndexArb = fc.integer({ min: 0, max: FORBIDDEN_PATTERNS.length - 1 })

    fc.assert(
      fc.property(componentArb, patternIndexArb, (componentFile, patternIndex) => {
        const content = componentContents[componentFile]
        const classNameValues = extractClassNameValues(content)
        const { pattern, description } = FORBIDDEN_PATTERNS[patternIndex]

        for (const classNameValue of classNameValues) {
          const hasMatch = pattern.test(classNameValue)
          // Reset lastIndex for global-like patterns
          pattern.lastIndex = 0
          if (hasMatch) {
            return false // Property violated
          }
        }
        return true // Property holds
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    )
  })
})


// Page files to validate
const PAGE_FILES = [
  'src/app/login/page.tsx',
  'src/app/settings/page.tsx',
] as const

// Read page files once
const pageContents: Record<string, string> = {}
for (const filePath of PAGE_FILES) {
  const fullPath = path.resolve(process.cwd(), filePath)
  pageContents[filePath] = fs.readFileSync(fullPath, 'utf-8')
}

describe('Property 4: Absence of hardcoded Tailwind color classes in login and settings pages', () => {
  /**
   * Feature: visual-style-system, Property 4: Absence of hardcoded Tailwind color classes in components
   *
   * Property-based test: for any combination of (page, forbidden pattern),
   * the className attributes in the page must not contain the forbidden pattern.
   *
   * **Validates: Requirements 4.1, 4.3, 4.5**
   */
  it('no login or settings page contains forbidden hardcoded Tailwind color classes in className attributes', () => {
    const pageArb = fc.constantFrom(...PAGE_FILES)
    const patternIndexArb = fc.integer({ min: 0, max: FORBIDDEN_PATTERNS.length - 1 })

    fc.assert(
      fc.property(pageArb, patternIndexArb, (pageFile, patternIndex) => {
        const content = pageContents[pageFile]
        const classNameValues = extractClassNameValues(content)
        const { pattern, description } = FORBIDDEN_PATTERNS[patternIndex]

        for (const classNameValue of classNameValues) {
          const hasMatch = pattern.test(classNameValue)
          // Reset lastIndex for global-like patterns
          pattern.lastIndex = 0
          if (hasMatch) {
            return false // Property violated
          }
        }
        return true // Property holds
      }),
      {
        numRuns: 100,
        verbose: true,
      },
    )
  })
})
