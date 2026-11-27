import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient.js'

export function bookmarksKey(bookId) {
  return ['bookmarks', bookId]
}

export function useBookmarks(bookId, enabled = true) {
  return useQuery({
    queryKey: bookmarksKey(bookId),
    queryFn: () => api.get(`/books/${bookId}/bookmarks`),
    select: (data) => data.bookmarks,
    enabled: Boolean(bookId) && enabled,
    staleTime: 10_000,
  })
}

export function useCreateBookmark(bookId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ page, label, note }) =>
      api.post(`/books/${bookId}/bookmarks`, { page, label, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarksKey(bookId) })
    },
  })
}

export function useDeleteBookmark(bookId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookmarkId) =>
      api.delete(`/books/${bookId}/bookmarks/${bookmarkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarksKey(bookId) })
    },
  })
}
