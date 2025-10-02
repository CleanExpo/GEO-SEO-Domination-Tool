import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface ApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  showToast?: boolean
  successMessage?: string
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })
  const { toast } = useToast()

  const execute = useCallback(
    async (
      apiCall: () => Promise<T>,
      options?: ApiOptions<T>
    ): Promise<T | null> => {
      try {
        setState({ data: null, loading: true, error: null })

        const data = await apiCall()

        setState({ data, loading: false, error: null })

        if (options?.showToast && options?.successMessage) {
          toast({
            title: 'Success',
            description: options.successMessage,
          })
        }

        options?.onSuccess?.(data)

        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error('An error occurred')

        setState({ data: null, loading: false, error: err })

        if (options?.showToast) {
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          })
        }

        options?.onError?.(err)

        return null
      }
    },
    [toast]
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// Specialized hook for GET requests
export function useApiGet<T>(url: string, options?: RequestInit) {
  const { execute, ...rest } = useApi<T>()

  const get = useCallback(
    (apiOptions?: ApiOptions<T>) => {
      return execute(async () => {
        const response = await fetch(url, {
          method: 'GET',
          ...options,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Failed to fetch')
        }

        return response.json()
      }, apiOptions)
    },
    [url, options, execute]
  )

  return { get, ...rest }
}

// Specialized hook for POST requests
export function useApiPost<T, D = any>(url: string, options?: RequestInit) {
  const { execute, ...rest } = useApi<T>()

  const post = useCallback(
    (data: D, apiOptions?: ApiOptions<T>) => {
      return execute(async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: JSON.stringify(data),
          ...options,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Failed to post')
        }

        return response.json()
      }, apiOptions)
    },
    [url, options, execute]
  )

  return { post, ...rest }
}

// Specialized hook for PUT requests
export function useApiPut<T, D = any>(url: string, options?: RequestInit) {
  const { execute, ...rest } = useApi<T>()

  const put = useCallback(
    (data: D, apiOptions?: ApiOptions<T>) => {
      return execute(async () => {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: JSON.stringify(data),
          ...options,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Failed to update')
        }

        return response.json()
      }, apiOptions)
    },
    [url, options, execute]
  )

  return { put, ...rest }
}

// Specialized hook for DELETE requests
export function useApiDelete<T>(url: string, options?: RequestInit) {
  const { execute, ...rest } = useApi<T>()

  const del = useCallback(
    (apiOptions?: ApiOptions<T>) => {
      return execute(async () => {
        const response = await fetch(url, {
          method: 'DELETE',
          ...options,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Failed to delete')
        }

        return response.json()
      }, apiOptions)
    },
    [url, options, execute]
  )

  return { delete: del, ...rest }
}
