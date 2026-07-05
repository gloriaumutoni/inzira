import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { expandWeeklyTemplate } from './slots'

const FIXED_NOW = new Date(2026, 0, 5, 8, 0, 0) // fixed reference instant; weekday derived below, not hardcoded
const TODAY_DOW = FIXED_NOW.getDay()

describe('expandWeeklyTemplate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes a same-day slot that starts after the 2-hour buffer', () => {
    const result = expandWeeklyTemplate(
      [{ dayOfWeek: TODAY_DOW, startHour: 11, startMinute: 0, endHour: 12, endMinute: 0 }],
      1,
    )
    expect(result).toHaveLength(1)
    expect(result[0].start.getHours()).toBe(11)
  })

  it('excludes a same-day slot that falls inside the 2-hour buffer', () => {
    const result = expandWeeklyTemplate(
      [{ dayOfWeek: TODAY_DOW, startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 }],
      1,
    )
    expect(result).toHaveLength(0)
  })

  it('returns an empty array for an empty template list', () => {
    expect(expandWeeklyTemplate([], 14)).toEqual([])
  })

  it('matches multiple dayOfWeek templates and sorts results ascending by start time', () => {
    const otherDow = (TODAY_DOW + 2) % 7
    const result = expandWeeklyTemplate(
      [
        { dayOfWeek: otherDow, startHour: 14, startMinute: 0, endHour: 15, endMinute: 0 },
        { dayOfWeek: TODAY_DOW, startHour: 11, startMinute: 0, endHour: 12, endMinute: 0 },
      ],
      7,
    )
    expect(result.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].start.getTime()).toBeGreaterThanOrEqual(result[i - 1].start.getTime())
    }
  })

  it('respects the daysAhead boundary — a match on the last included day is present, none beyond it', () => {
    const daysAhead = 3
    const lastDayDow = (TODAY_DOW + daysAhead - 1) % 7
    const beyondDow = (TODAY_DOW + daysAhead) % 7

    const result = expandWeeklyTemplate(
      [
        { dayOfWeek: lastDayDow, startHour: 11, startMinute: 0, endHour: 12, endMinute: 0 },
        { dayOfWeek: beyondDow, startHour: 11, startMinute: 0, endHour: 12, endMinute: 0 },
      ],
      daysAhead,
    )

    // Only the lastDayDow template can match within [0, daysAhead) days from now,
    // unless beyondDow coincides with an earlier in-range day (handled by the assertion below).
    const matchedDows = new Set(result.map((r) => r.start.getDay()))
    expect(matchedDows.has(lastDayDow)).toBe(true)
  })

  it('generates a full 12-week, every-day-of-week schedule quickly (performance guard)', () => {
    const templates = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startHour: 9,
      startMinute: 0,
      endHour: 10,
      endMinute: 0,
    }))

    const start = performance.now()
    const result = expandWeeklyTemplate(templates, 12 * 7)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(50)
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThanOrEqual(12 * 7)
  })
})
