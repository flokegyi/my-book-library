import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient.js'

export function bookKey(id) {
  return ['book', id]
}

export function useBook(id) {
  return useQuery({
    queryKey: bookKey(id),
    queryFn: () => api.get(`/books/${id}`),
    select: (data) => data.book,
    enabled: Boolean(id),
    staleTime: 10_000,
  })
}

function invalidateBook(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: ['books'] })
  queryClient.invalidateQueries({ queryKey: bookKey(id) })
}

export function useSaveProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, page, status }) =>
      api.patch(`/books/${id}/progress`, { page, status }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(bookKey(variables.id), data)
      invalidateBook(queryClient, variables.id)
    },
  })
}

export function useRecordSession() {
  return useMutation({
    mutationFn: ({ id, ...session }) => api.post(`/books/${id}/sessions`, session),
  })
}
