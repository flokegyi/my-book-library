import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient.js'
import { bookKey } from './useBook.js'
import { bookmarksKey } from './useBookmarks.js'

const booksKey = ['books']
const tagsKey = ['tags']

function invalidateLibrary(queryClient) {
  queryClient.invalidateQueries({ queryKey: booksKey })
  queryClient.invalidateQueries({ queryKey: tagsKey })
}

export function useBooks(filters) {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: () => {
      const params = new URLSearchParams()

      if (filters.q) params.set('q', filters.q)
      if (filters.status) params.set('status', filters.status)
      if (filters.tagId) params.set('tagId', filters.tagId)
      if (filters.sort) params.set('sort', filters.sort)

      const query = params.toString()
      return api.get(`/books${query ? `?${query}` : ''}`)
    },
    select: (data) => data.books,
    placeholderData: keepPreviousData,
  })
}

export function useUploadBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ formData, onProgress }) =>
      api.upload('/books', formData, { onProgress }),
    onSuccess: () => invalidateLibrary(queryClient),
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...values }) => api.patch(`/books/${id}`, values),
    onSuccess: (_data, { id }) => {
      invalidateLibrary(queryClient)
      queryClient.invalidateQueries({ queryKey: bookKey(id) })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => api.delete(`/books/${id}`),
    onSuccess: (_data, id) => {
      invalidateLibrary(queryClient)
      queryClient.removeQueries({ queryKey: bookKey(id) })
      queryClient.removeQueries({ queryKey: bookmarksKey(id) })
    },
  })
}

export function usePinBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, pinned }) =>
      api.patch(`/books/${id}/pin`, { pinned }),
    onSuccess: () => invalidateLibrary(queryClient),
  })
}
