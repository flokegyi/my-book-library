import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient.js'

const authQueryKey = ['auth', 'me']

export function useAuth() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: async () => {
      const data = await api.get('/auth/me')
      return data.user
    },
    retry: false,
    staleTime: 30_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials) => api.post('/auth/login', credentials),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authQueryKey, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useChangePassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values) => api.patch('/auth/password', values),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
