'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

type UrlSyncState = {
  fixedFirst?: number | null
  sortBy?: 'ev' | 'probability' | 'odds'
  sortOrder?: 'desc' | 'asc'
  showLimit?: number
}

export function useUrlSync() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Get current state from URL
  const getStateFromUrl = useCallback((): UrlSyncState => {
    const fixedFirst = searchParams.get('fixFirst')
      ? parseInt(searchParams.get('fixFirst')!)
      : null
    const sortBy = (searchParams.get('sortBy') as 'ev' | 'probability' | 'odds') || 'ev'
    const sortOrder = (searchParams.get('sortOrder') as 'desc' | 'asc') || 'desc'
    const showLimit = searchParams.get('showLimit')
      ? parseInt(searchParams.get('showLimit')!)
      : 5

    return {
      fixedFirst,
      sortBy,
      sortOrder,
      showLimit,
    }
  }, [searchParams])

  // Update URL with new state
  const updateUrl = useCallback((newState: Partial<UrlSyncState>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))

    // Update or remove parameters
    Object.entries(newState).forEach(([key, value]) => {
      if (key === 'fixedFirst') {
        if (value === null || value === undefined) {
          current.delete('fixFirst')
        } else {
          current.set('fixFirst', value.toString())
        }
      } else if (key === 'sortBy') {
        if (value === 'ev') {
          current.delete('sortBy') // Default value
        } else if (value) {
          current.set('sortBy', value.toString())
        }
      } else if (key === 'sortOrder') {
        if (value === 'desc') {
          current.delete('sortOrder') // Default value
        } else if (value) {
          current.set('sortOrder', value.toString())
        }
      } else if (key === 'showLimit') {
        if (value === 5) {
          current.delete('showLimit') // Default value
        } else if (value) {
          current.set('showLimit', value.toString())
        }
      }
    })

    const search = current.toString()
    const query = search ? `?${search}` : ''

    // Update URL without page reload
    router.replace(`${pathname}${query}`, { scroll: false })
  }, [searchParams, router, pathname])

  // Get current full URL for sharing
  const getShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}${pathname}${window.location.search}`
  }, [pathname])

  // Copy URL to clipboard
  const copyShareUrl = useCallback(async () => {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch (error) {
      console.error('Failed to copy URL:', error)
      return false
    }
  }, [getShareUrl])

  return {
    getStateFromUrl,
    updateUrl,
    getShareUrl,
    copyShareUrl,
  }
}