import { describe, it, expect } from 'vitest'
import { COMBINATIONS } from './combinations'

describe('COMBINATIONS data integrity', () => {
  it('seeds exactly 15 combinations, matching Rwanda\'s 15 prescribed A-Level combinations', () => {
    expect(COMBINATIONS).toHaveLength(15)
  })

  it('has a unique code for every combination', () => {
    const codes = COMBINATIONS.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('has non-empty subjects, careers, and description for every combination', () => {
    for (const combination of COMBINATIONS) {
      expect(combination.subjects.length).toBeGreaterThan(0)
      expect(combination.careers.length).toBeGreaterThan(0)
      expect(combination.description.trim().length).toBeGreaterThan(0)
      expect(combination.name.trim().length).toBeGreaterThan(0)
    }
  })
})
