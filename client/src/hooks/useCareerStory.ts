import { useState, useEffect } from 'react'
import { getMyCareerStories, type CareerStory } from '@/api/careerStories.api'

export function useCareerStory() {
  const [stories, setStories] = useState<CareerStory[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    getMyCareerStories()
      .then(setStories)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  return { stories, loading, refresh }
}
