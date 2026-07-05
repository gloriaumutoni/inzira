import { describe, it, expect } from 'vitest'
import { PATHWAY_LEAVES, PATHWAY_LEAF_CODES } from './pathways'

describe('PATHWAY_LEAVES data integrity', () => {
  it('seeds exactly 4 pathway leaves', () => {
    expect(PATHWAY_LEAVES).toHaveLength(4)
  })

  it('has a unique code for every leaf', () => {
    const codes = PATHWAY_LEAVES.map((l) => l.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('has non-empty subjects, careerAreas, description, and label for every leaf', () => {
    for (const leaf of PATHWAY_LEAVES) {
      expect(leaf.subjects.length).toBeGreaterThan(0)
      expect(leaf.careerAreas.length).toBeGreaterThan(0)
      expect(leaf.description.trim().length).toBeGreaterThan(0)
      expect(leaf.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('PATHWAY_LEAF_CODES contains exactly the 4 expected codes', () => {
    expect(PATHWAY_LEAF_CODES.sort()).toEqual(
      ['PATH_MS_NATURAL', 'PATH_MS_APPLIED', 'PATH_ARTS_HUMANITIES', 'PATH_LANGUAGES'].sort()
    )
  })
})
