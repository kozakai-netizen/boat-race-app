'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [dataMode, setDataMode] = useState<string>('')

  useEffect(() => {
    setDataMode(process.env.NEXT_PUBLIC_DATA_MODE || 'mock')
  }, [])

  const handleLogout = () => {
    document.cookie = 'admin-token=; path=/; max-age=0'
    router.push('/admin/login')
  }

  // Skip layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const navigation = [
    { name: 'ダッシュボード', href: '/admin', current: pathname === '/admin' },
    { name: 'レース管理', href: '/admin/races', current: pathname === '/admin/races' },
    { name: '選手管理', href: '/admin/players', current: pathname === '/admin/players' },
    { name: '結果管理', href: '/admin/results', current: pathname === '/admin/results' },
    { name: '写真管理', href: '/admin/photos', current: pathname.startsWith('/admin/photos') },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-xl font-bold text-blue-600">
                  管理画面
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Data Mode Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                dataMode === 'live'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
              }`}>
                {dataMode === 'live' ? '[LIVE]' : '[DEMO]'}
              </div>

              {/* Public Site Link */}
              <Link
                href="/suminoye"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                公開サイト
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg text-sm font-medium transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}