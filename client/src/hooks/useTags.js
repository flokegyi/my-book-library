import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient.js'

const tagsKey = ['tags']
const booksKey = ['books']

function invalidateTags(queryClient) {
  queryClient.invalidateQueries({ queryKey: tagsKey })
  queryClient.invalidateQueries({ queryKey: booksKey })
}

export function useTags() {
  return useQuery({
    queryKey: tagsKey,
    queryFn: () => api.get('/tags'),
    select: (data) => data.tags,
    staleTime: 60_000,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values) => api.post('/tags', values),
    onSuccess: () => invalidateTags(queryClient),
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...values }) => api.patch(`/tags/${id}`, values),
    onSuccess: () => invalidateTags(queryClient),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => api.delete(`/tags/${id}`),
    onSuccess: () => invalidateTags(queryClient),
  })
}
