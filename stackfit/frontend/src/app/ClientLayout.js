'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import { getAuthToken } from '@/utils/auth'
import { SidebarProvider, useSidebar } from './context/SidebarContext'

function MainLayout({ children }) {
  const { isExpanded } = useSidebar()
  
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div 
        className="transition-all duration-300"
        style={{
          marginLeft: isExpanded ? '16rem' : '5rem',
        }}
      >
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const isAuthPage = pathname === '/'

  useEffect(() => {
    const token = getAuthToken()
    setIsAuthenticated(!!token)

    if (!token && !isAuthPage) {
      router.push('/')
    }
  }, [pathname, isAuthPage, router])

  if (!isAuthPage && isAuthenticated) {
    return (
      <SidebarProvider>
        <MainLayout>{children}</MainLayout>
      </SidebarProvider>
    )
  }

  return <main>{children}</main>
} 