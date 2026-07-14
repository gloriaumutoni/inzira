import { useConfidenceLogsQuery, groupLogsByCombo } from '@/hooks/queries/studentQueries'

export interface ConfidenceLog {
  id: string
  score: number
  note: string | null
  combination: string | null
  sessionId: string | null
  changedThinking: boolean | null
  createdAt: string
}

export interface CombinationTrend {
  combination: string
  logs: ConfidenceLog[]
}

const useConfidenceLogs = () => {
  const { data, isLoading, refetch } = useConfidenceLogsQuery()
  const logs = data ?? []

  return {
    logs,
    byCombo: groupLogsByCombo(logs),
    loading: isLoading,
    refetch: () => { refetch() },
  }
}

export default useConfidenceLogs
