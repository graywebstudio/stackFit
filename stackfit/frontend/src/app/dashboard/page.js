'use client'
import { useState, useEffect } from 'react'
import { Calendar, Activity, TrendingUp, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { getAuthToken } from '@/utils/auth'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }))
  const [stats, setStats] = useState({
    activeMembers: 0,
    newMembersThisMonth: 0,
    revenue: 0,
    attendanceRate: 0
  })
  const [events, setEvents] = useState([])
  const [membershipTypes, setMembershipTypes] = useState([])
  const [demographics, setDemographics] = useState({ male: 0, female: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      // Fetch dashboard statistics
      const statsResponse = await fetch('http://localhost:3001/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Fetch membership types
      const membershipsResponse = await fetch('http://localhost:3001/api/admin/memberships/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Fetch upcoming events
      const eventsResponse = await fetch('http://localhost:3001/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!statsResponse.ok || !membershipsResponse.ok || !eventsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const statsData = await statsResponse.json()
      const membershipsData = await membershipsResponse.json()
      const eventsData = await eventsResponse.json()

      setStats({
        activeMembers: statsData.activeMembers || 0,
        newMembersThisMonth: statsData.newMembersThisMonth || 0,
        revenue: statsData.revenue || 0,
        attendanceRate: statsData.attendanceRate || 0
      })

      setMembershipTypes(membershipsData)
      setEvents(eventsData)
      setDemographics({
        male: statsData.demographics?.male || 0,
        female: statsData.demographics?.female || 0,
        total: statsData.demographics?.total || 0
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // Calendar days
  const calendarDays = [
    { day: 'Mon', abbr: 'M' },
    { day: 'Tue', abbr: 'T' },
    { day: 'Wed', abbr: 'W' },
    { day: 'Thu', abbr: 'T' },
    { day: 'Fri', abbr: 'F' },
    { day: 'Sat', abbr: 'S' },
    { day: 'Sun', abbr: 'S' },
  ]

  // Generate calendar weeks for current month
  const generateCalendarWeeks = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    const weeks = []
    let currentWeek = Array(7).fill(null)
    let currentDate = 1

    // Fill in the first week
    for (let i = firstDay.getDay(); i < 7 && currentDate <= lastDay.getDate(); i++) {
      currentWeek[i] = currentDate++
    }
    weeks.push([...currentWeek])

    // Fill in the rest of the weeks
    currentWeek = Array(7).fill(null)
    let dayOfWeek = 0

    while (currentDate <= lastDay.getDate()) {
      currentWeek[dayOfWeek] = currentDate++
      
      if (dayOfWeek === 6) {
        weeks.push([...currentWeek])
        currentWeek = Array(7).fill(null)
        dayOfWeek = 0
      } else {
        dayOfWeek++
      }
    }

    if (dayOfWeek > 0) {
      weeks.push(currentWeek)
    }

    return weeks
  }

  const calendarWeeks = generateCalendarWeeks()

  // Get CSS class for a specific date
  const getDateClass = (day) => {
    if (!day) return '';
    
    // Check if there are events on this day
    const hasEvent = events.some(event => {
      const eventDate = new Date(event.date)
      return eventDate.getDate() === day && 
             eventDate.getMonth() === new Date().getMonth() &&
             eventDate.getFullYear() === new Date().getFullYear()
    })
    
    if (hasEvent) {
      return 'bg-white/10 text-white font-medium rounded-full';
    }
    
    // Weekend days
    if (day % 7 === 0 || day % 7 === 6) {
      return 'text-white/50';
    }
    
    return '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white/70">Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-black border-white/10 shadow-sm">
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/50">Active Members</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.activeMembers}</p>
            </div>
            <Users size={24} className="text-white/70" />
          </CardContent>
        </Card>
        
        <Card className="bg-black border-white/10 shadow-sm">
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/50">New Members</p>
              <p className="text-2xl font-bold text-white mt-2">+{stats.newMembersThisMonth}</p>
            </div>
            <TrendingUp size={24} className="text-white/70" />
          </CardContent>
        </Card>
        
        <Card className="bg-black border-white/10 shadow-sm">
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/50">Revenue</p>
              <p className="text-2xl font-bold text-white mt-2">${stats.revenue}</p>
            </div>
            <Activity size={24} className="text-white/70" />
          </CardContent>
        </Card>
        
        <Card className="bg-black border-white/10 shadow-sm">
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/50">Attendance Rate</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.attendanceRate}%</p>
            </div>
            <Calendar size={24} className="text-white/70" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Member Demographics Card */}
        <Card className="bg-black border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-white">
              Member Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Donut chart */}
                <div className="w-36 h-36 rounded-full border-8 border-white/70 relative">
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-white/20"
                    style={{ 
                      transform: `rotate(${(demographics.male / demographics.total) * 360}deg)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{demographics.total}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white/70 rounded-full mr-2"></div>
                <span className="text-xs text-white/50">
                  Male ({Math.round((demographics.male / demographics.total) * 100)}%)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white/20 rounded-full mr-2"></div>
                <span className="text-xs text-white/50">
                  Female ({Math.round((demographics.female / demographics.total) * 100)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Card */}
        <Card className="col-span-2 bg-black border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-white">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <div className="text-center text-sm font-medium text-white">
                {currentMonth}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {calendarDays.map((day) => (
                  <div key={day.day} className="text-center text-xs text-white/50">
                    {day.abbr}
                  </div>
                ))}

                {calendarWeeks.map((week, weekIndex) => (
                  week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`text-center py-2 text-xs ${day ? 'cursor-pointer hover:bg-white/5' : ''} 
                        ${getDateClass(day)}`}
                    >
                      {day || ''}
                    </div>
                  ))
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Events Table */}
        <Card className="col-span-2 bg-black border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-white">
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="w-[500px] text-white/70">Event</TableHead>
                  <TableHead className="text-right text-white/70">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} className="border-white/10">
                    <TableCell>
                      <div>
                        {event.title}
                        {event.department && (
                          <div className="text-xs text-white/50">{event.department}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(event.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Membership Types Section */}
        <Card className="bg-black border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-white">
              Membership Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {membershipTypes.map((membership) => (
              <div key={membership.id} className="flex items-start justify-between p-3 rounded-md border border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {membership.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-white">{membership.name}</div>
                    <div className="text-xs text-white/50">{membership.active_count || 0} active members</div>
                  </div>
                </div>
                <div className="text-white/70 text-sm">${membership.price}/mo</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
