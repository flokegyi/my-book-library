import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient.js'

export const readingStatsKey = ['reading', 'stats']

export function useReadingStats(days = 7) {
  return useQuery({
    queryKey: [...readingStatsKey, days],
    queryFn: () => {
      const params = new URLSearchParams({
        days: String(days),
        offset: String(-new Date().getTimezoneOffset()),
      })

      return api.get(`/reading/stats?${params.toString()}`)
    },
    select: (data) => data.stats,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
