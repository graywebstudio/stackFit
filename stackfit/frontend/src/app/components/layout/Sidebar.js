'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home,
  Users, 
  Tag, 
  Calendar, 
  DollarSign, 
  Clock, 
  Settings,
  LogOut,
  ChevronRight,
  Menu
} from 'lucide-react'
import { useSidebar } from '@/app/context/SidebarContext'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from '@/lib/utils'
import { removeAuthToken } from '@/utils/auth'
import { toast } from "sonner"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Members', href: '/members', icon: Users, hasSubmenu: true },
  { name: 'Memberships', href: '/memberships', icon: Tag, hasSubmenu: true },
  { name: 'Attendance', href: '/attendance', icon: Calendar, hasSubmenu: true },
  { name: 'Payments', href: '/payments', icon: DollarSign, hasSubmenu: true },
  { name: 'Due Dates', href: '/due-dates', icon: Clock, hasSubmenu: true },
  { name: 'Settings', href: '/settings', icon: Settings, hasSubmenu: true }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isExpanded, setIsExpanded } = useSidebar()

  const handleLogout = () => {
    removeAuthToken()
    toast.success("Logged out successfully")
    router.push('/')
  }

  return (
    <div className={`fixed left-0 top-0 bottom-0 bg-black text-white z-50 flex flex-col h-full transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
      {/* Logo and toggle */}
      <div className="px-4 py-6 flex items-center justify-between">
        <div className="text-white text-2xl font-bold tracking-wider">
          {isExpanded ? 'StackFit' : 'SF'}
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <div className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            return (
              <Link key={item.name} href={item.href} passHref>
                <div
                  className={cn(
                    "flex items-center px-3 py-3 rounded-md text-sm transition-colors duration-150 cursor-pointer",
                    isActive 
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={isActive ? "text-white" : ""} />
                  
                  {isExpanded && (
                    <div className="ml-3 flex flex-1 items-center justify-between">
                      <span>{item.name}</span>
                      {item.hasSubmenu && <ChevronRight size={16} className="opacity-70" />}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User and Logout */}
      <div className="p-4 border-t border-white/10">
        <div className={cn(
          "flex items-center",
          isExpanded ? "justify-between" : "justify-center"
        )}>
          <div className="flex items-center">
            <Avatar className="h-8 w-8 bg-white/10 text-white">
              <AvatarImage src="/avatar-placeholder.png" />
              <AvatarFallback className="bg-white/10 text-white">
                AU
              </AvatarFallback>
            </Avatar>
            
            {isExpanded && (
              <div className="ml-3">
                <p className="text-sm font-medium">Admin User</p>
              </div>
            )}
          </div>
          
          {isExpanded ? (
            <button 
              className="text-white/70 hover:text-white p-2 rounded-md hover:bg-white/10"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button 
              className="mt-4 text-white/70 hover:text-white p-2 rounded-md hover:bg-white/10 w-full flex justify-center"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
