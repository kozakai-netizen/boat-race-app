'use client'

import { useState, useEffect } from 'react'

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(true) // Temporarily always true for development
  const [isLoading, setIsLoading] = useState(false) // No loading needed

  useEffect(() => {
    // TEMPORARILY DISABLED - Always allow admin access for development
    // TODO: Re-enable authentication later

    // const checkAuth = async () => {
    //   try {
    //     const response = await fetch('/api/admin/check-auth')
    //     if (response.ok) {
    //       const data = await response.json()
    //       setIsAdmin(data.isAdmin === true)
    //     } else {
    //       setIsAdmin(false)
    //     }
    //   } catch (error) {
    //     console.error('Auth check failed:', error)
    //     setIsAdmin(false)
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }

    // checkAuth()
    setIsAdmin(true) // Always admin for development
    setIsLoading(false)
  }, [])

  return { isAdmin, isLoading }
}