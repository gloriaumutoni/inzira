import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../prisma/client', () => ({
  prisma: {
    groupSession: { findMany: vi.fn() },
  },
}))

vi.mock('./email.service', () => ({}))

import { prisma } from '../prisma/client'
import { list } from './groupSessions.service'

function mockPrisma() {
  return prisma as unknown as {
    groupSession: { findMany: ReturnType<typeof vi.fn> }
  }
}

describe('groupSessions.service list()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const p = mockPrisma()
    p.groupSession.findMany.mockResolvedValue([])
  })

  it('does not filter by combination when none is requested', async () => {
    await list({})
    const p = mockPrisma()
    const { where } = p.groupSession.findMany.mock.calls[0][0]
    expect(where.combinations).toBeUndefined()
    expect(where.OR).toBeUndefined()
  })

  it('matches tagged sessions but still includes untagged ones when a combination filter is applied', async () => {
    await list({ combination: 'PCM' })
    const p = mockPrisma()
    const { where } = p.groupSession.findMany.mock.calls[0][0]
    expect(where.combinations).toBeUndefined()
    expect(where.OR).toEqual([
      { combinations: { has: 'PCM' } },
      { combinations: { isEmpty: true } },
    ])
  })

  it('uses hasSome for multiple combinations while still including untagged sessions', async () => {
    await list({ combination: 'PCM,MPC' })
    const p = mockPrisma()
    const { where } = p.groupSession.findMany.mock.calls[0][0]
    expect(where.OR).toEqual([
      { combinations: { hasSome: ['PCM', 'MPC'] } },
      { combinations: { isEmpty: true } },
    ])
  })
})
