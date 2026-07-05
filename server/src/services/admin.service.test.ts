import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../prisma/client', () => ({
  prisma: {
    student: { count: vi.fn(), findMany: vi.fn() },
    session: { count: vi.fn() },
  },
}))

import { prisma } from '../prisma/client'
import { getReportSummary, getReportStudents } from './admin.service'

function mockedPrisma() {
  return prisma as unknown as {
    student: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
    session: { count: ReturnType<typeof vi.fn> }
  }
}

describe('admin.service getReportSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('guards against divide-by-zero when there are no sessions yet', async () => {
    mockedPrisma().student.count.mockResolvedValue(0)
    mockedPrisma().session.count.mockResolvedValue(0)
    const result = await getReportSummary()
    expect(result.completionRate).toBe(0)
  })

  it('computes a rounded completion percentage', async () => {
    mockedPrisma().student.count.mockResolvedValueOnce(50).mockResolvedValueOnce(20)
    mockedPrisma().session.count.mockResolvedValueOnce(30).mockResolvedValueOnce(10)
    const result = await getReportSummary()
    expect(result.totalStudents).toBe(50)
    expect(result.engagingStudents).toBe(20)
    expect(result.totalSessions).toBe(30)
    expect(result.completedSessions).toBe(10)
    expect(result.completionRate).toBe(Math.round((10 / 30) * 100))
  })
})

describe('admin.service getReportStudents pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedPrisma().student.findMany.mockResolvedValue([])
  })

  it('computes totalPages from the page size (25) for a normal paginated request', async () => {
    mockedPrisma().student.count.mockResolvedValue(60)
    const result = await getReportStudents('A_LEVEL', 1)
    expect(result.totalPages).toBe(3) // ceil(60 / 25)
    const [, findManyArgs] = [null, mockedPrisma().student.findMany.mock.calls[0][0]]
    expect(findManyArgs.skip).toBe(0)
    expect(findManyArgs.take).toBe(25)
  })

  it('requests up to the export cap (5000) and skips pagination when all=true', async () => {
    mockedPrisma().student.count.mockResolvedValue(7000)
    await getReportStudents('A_LEVEL', 1, true)
    const findManyArgs = mockedPrisma().student.findMany.mock.calls[0][0]
    expect(findManyArgs.skip).toBe(0)
    expect(findManyArgs.take).toBe(5000)
  })
})
