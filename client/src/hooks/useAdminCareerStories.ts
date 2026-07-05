import { useState, useEffect, useCallback } from 'react'
import {
  adminListStoriesByStatus,
  adminApproveStory,
  adminRejectStory,
  adminUnpublishStory,
  adminCreateCareerStory,
  type CareerStory,
  type AdminCareerStoryPayload,
} from '@/api/careerStories.api'

type Tab = 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'

interface UseAdminCareerStoriesResult {
  stories: CareerStory[]
  loading: boolean
  error: string
  actingId: string | null
  tab: Tab
  setTab: (tab: Tab) => void
  approve: (id: string) => Promise<void>
  reject: (id: string, reason: string) => Promise<void>
  unpublish: (id: string) => Promise<void>
  create: (payload: AdminCareerStoryPayload) => Promise<void>
}

const useAdminCareerStories = (): UseAdminCareerStoriesResult => {
  const [tab, setTabState] = useState<Tab>('PENDING_REVIEW')
  const [stories, setStories] = useState<CareerStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback((status: Tab) => {
    setLoading(true)
    setError('')
    adminListStoriesByStatus(status)
      .then(setStories)
      .catch(() => setError('Failed to load stories'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(tab)
  }, [tab, load])

  const setTab = (t: Tab) => {
    setStories([])
    setTabState(t)
  }

  const approve = async (id: string) => {
    setActingId(id)
    try {
      await adminApproveStory(id)
      setStories(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Failed to approve story')
    } finally {
      setActingId(null)
    }
  }

  const reject = async (id: string, reason: string) => {
    setActingId(id)
    try {
      await adminRejectStory(id, reason)
      setStories(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Failed to reject story')
    } finally {
      setActingId(null)
    }
  }

  const unpublish = async (id: string) => {
    setActingId(id)
    try {
      await adminUnpublishStory(id)
      setStories(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Failed to unpublish story')
    } finally {
      setActingId(null)
    }
  }

  const create = async (payload: AdminCareerStoryPayload) => {
    setActingId('creating')
    try {
      const story = await adminCreateCareerStory(payload)
      if (tab === 'PUBLISHED') {
        setStories(prev => [story, ...prev])
      }
    } catch {
      setError('Failed to create story')
      throw new Error('Failed to create story')
    } finally {
      setActingId(null)
    }
  }

  return { stories, loading, error, actingId, tab, setTab, approve, reject, unpublish, create }
}

export default useAdminCareerStories
