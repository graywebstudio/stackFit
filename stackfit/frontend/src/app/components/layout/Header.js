'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell } from 'lucide-react'
import { removeAuthToken } from '@/utils/auth'
import Button from '../ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from '@/components/ui/input'
import { useSidebar } from '@/app/context/SidebarContext'

export default function Header() {
  const router = useRouter()
  const { isExpanded } = useSidebar()
  const [user] = useState({
    name: 'Admin User',
    avatar: '/images/avatar-placeholder.png'
  })

  const handleLogout = () => {
    removeAuthToken()
    router.push('/')
  }

  return (
    <header className="sticky top-0 w-full bg-black z-40 border-b border-white/10 py-3 px-6">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input 
              placeholder="Search members..." 
              className="pl-10 bg-white/5 border-white/10 text-white focus:border-white/20 focus:ring-white/10"
            />
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-6">
          {/* Search button */}
          <Button 
            variant="outline" 
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Search
          </Button>

          {/* Notifications */}
          <button className="text-white/70 hover:text-white">
            <Bell size={20} />
          </button>

          {/* User */}
          <div className="flex items-center space-x-3">
            <div className="text-sm text-right">
              <span className="text-white/50">Logged in as:</span>
              <p className="font-medium text-white">{user.name}</p>
            </div>
            <Avatar className="h-8 w-8 bg-white/10 text-white">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
