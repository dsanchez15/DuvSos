// Feature: checklist-improvements, Property 8: Blocker clearing produces correct payload
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { computeBlockerPayload } from '@/lib/checklist-utils'

/**
 * Validates: Requirements 5.1
 *
 * Property 8: Blocker clearing produces correct payload
 * For any checklist item that has a non-null blockedByItemId, when the user
 * selects "No Blocker" in the edit form, the resulting API payload SHALL contain
 * blockedByItemId: null (explicitly set), distinguishing it from the case where
 * the blocker field was not modified (field absent from payload).
 */
describe('Property 8: Blocker clearing produces correct payload', () => {
  /** Arbitrary for a positive item ID (blockers are always positive integers) */
  const positiveId = fc.integer({ min: 1, max: 100000 })

  /** Arbitrary for currentBlocker: either a positive number or null */
  const currentBlockerArb = fc.oneof(positiveId, fc.constant(null))

  it('when editBlockedBy="" and item has a blocker → payload has blockedByItemId: null', () => {
    fc.assert(
      fc.property(positiveId, (currentBlocker) => {
        const payload = computeBlockerPayload(currentBlocker, '')
        expect(payload).toHaveProperty('blockedByItemId', null)
      }),
      { numRuns: 100 }
    )
  })

  it('when editBlockedBy="" and item has no blocker → payload does NOT have blockedByItemId key', () => {
    fc.assert(
      fc.property(fc.constant(null), (currentBlocker) => {
        const payload = computeBlockerPayload(currentBlocker, '')
        expect(payload).not.toHaveProperty('blockedByItemId')
        expect(Object.keys(payload)).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })

  it('when editBlockedBy=someId and it differs from current → payload has blockedByItemId: someId', () => {
    fc.assert(
      fc.property(
        currentBlockerArb,
        positiveId,
        (currentBlocker, newBlocker) => {
          // Ensure the new blocker is different from the current one
          fc.pre(newBlocker !== currentBlocker)

          const payload = computeBlockerPayload(currentBlocker, newBlocker)
          expect(payload).toHaveProperty('blockedByItemId', newBlocker)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('when editBlockedBy=someId and it equals current → payload does NOT have blockedByItemId key', () => {
    fc.assert(
      fc.property(positiveId, (blockerId) => {
        const payload = computeBlockerPayload(blockerId, blockerId)
        expect(payload).not.toHaveProperty('blockedByItemId')
        expect(Object.keys(payload)).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })
})
