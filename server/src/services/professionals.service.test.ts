import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../prisma/client', () => ({
  prisma: {
    mentorSlot: { createMany: vi.fn(), findMany: vi.fn() },
  },
}))

import { prisma } from '../prisma/client'
import { createRecurringMentorSlots } from './professionals.service'

const FIXED_NOW = new Date(2026, 0, 5, 8, 0, 0)

function mockedPrisma() {
  return prisma as unknown as {
    mentorSlot: { createMany: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
  }
}

const validData = {
  daysOfWeek: [1],
  startHour: 9,
  startMinute: 0,
  endHour: 10,
  endMinute: 0,
  meetLink: 'https://meet.google.com/abc-defg-hij',
  weeks: 4,
}

describe('createRecurringMentorSlots validation', () => {
  it('rejects an empty daysOfWeek array', async () => {
    await expect(createRecurringMentorSlots('pro-1', { ...validData, daysOfWeek: [] })).rejects.toThrow(/at least one day/i)
  })

  it('rejects when end time is not after start time', async () => {
    await expect(
      createRecurringMentorSlots('pro-1', { ...validData, startHour: 10, startMinute: 0, endHour: 9, endMinute: 0 }),
    ).rejects.toThrow(/end time must be after/i)
    await expect(
      createRecurringMentorSlots('pro-1', { ...validData, startHour: 10, startMinute: 30, endHour: 10, endMinute: 30 }),
    ).rejects.toThrow(/end time must be after/i)
  })

  it('rejects a blank meet link', async () => {
    await expect(createRecurringMentorSlots('pro-1', { ...validData, meetLink: '   ' })).rejects.toThrow(/meet link is required/i)
  })

  it.each([0, 13, 1.5])('rejects weeks=%s outside the 1-12 integer range', async (weeks) => {
    await expect(createRecurringMentorSlots('pro-1', { ...validData, weeks: weeks as number })).rejects.toThrow(/weeks must be between/i)
  })
})

describe('createRecurringMentorSlots skipDuplicates reconciliation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports created/skipped counts based on how many rows Prisma actually inserted', async () => {
    const data = {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startHour: 9,
      startMinute: 0,
      endHour: 10,
      endMinute: 0,
      meetLink: 'https://meet.google.com/abc-defg-hij',
      weeks: 2,
    }
    const p = mockedPrisma()
    p.mentorSlot.createMany.mockImplementation(async ({ data: rows }: any) => ({ count: Math.max(rows.length - 2, 0) }))
    p.mentorSlot.findMany.mockResolvedValue([{ id: 'slot-1' }])

    const result = await createRecurringMentorSlots('pro-1', data)

    expect(p.mentorSlot.createMany).toHaveBeenCalledTimes(1)
    const insertedRows = p.mentorSlot.createMany.mock.calls[0][0].data
    expect(insertedRows.length).toBeGreaterThan(0)
    expect(result.created).toBe(Math.max(insertedRows.length - 2, 0))
    expect(result.skipped).toBe(insertedRows.length - result.created)
  })

  it('returns created:0, skipped:0 and skips the DB call when no occurrences fall in range', async () => {
    const result = await createRecurringMentorSlots('pro-1', {
      daysOfWeek: [9], // never matches Date#getDay() (0-6), so no occurrences are generated
      startHour: 9,
      startMinute: 0,
      endHour: 10,
      endMinute: 0,
      meetLink: 'https://meet.google.com/abc-defg-hij',
      weeks: 1,
    })
    expect(result).toEqual({ created: 0, skipped: 0, slots: [] })
    expect(mockedPrisma().mentorSlot.createMany).not.toHaveBeenCalled()
  })
})
