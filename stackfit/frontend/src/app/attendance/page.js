'use client'
import { useState, useEffect } from 'react'
import { toast } from "sonner"
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { getAuthToken } from '@/utils/auth'

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10

  useEffect(() => {
    fetchAttendance()
  }, [date, currentPage, searchTerm])

  const fetchAttendance = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Fetch all active and pending_payment members with pagination and search
      const params = new URLSearchParams({
        status: 'active,pending_payment',
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const membersResponse = await fetch(`http://localhost:3001/api/members?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!membersResponse.ok) {
        throw new Error('Failed to fetch members')
      }

      const membersData = await membersResponse.json()
      setTotalPages(membersData.totalPages)

      // Fetch attendance for the selected date
      const attendanceResponse = await fetch(`http://localhost:3001/api/attendance?startDate=${date}&endDate=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!attendanceResponse.ok) {
        throw new Error('Failed to fetch attendance')
      }

      const attendanceData = await attendanceResponse.json()

      // Merge members with their attendance
      const mergedData = membersData.members.map(member => {
        const attendance = attendanceData.find(a => a.member_id === member.id)
        return {
          ...member,
          status: attendance ? attendance.status : null
        }
      })

      setMembers(mergedData)
      updateStats(mergedData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Failed to load attendance data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (e) => {
    const newDate = e.target.value
    // Prevent selecting future dates
    if (new Date(newDate) > new Date()) {
      toast.error('Cannot select future dates')
      return
    }
    setDate(newDate)
  }

  const updateStats = (data) => {
    setStats({
      total: data.length,
      present: data.filter(m => m.status === 'present').length,
      absent: data.filter(m => m.status === 'absent').length
    })
  }

  const markAttendance = async (memberId, status) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Check if attendance is already marked
      if (members.find(m => m.id === memberId && m.status === status)) {
        toast.info('Attendance already marked')
        return
      }

      const response = await fetch('http://localhost:3001/api/attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: memberId,
          date: date,
          status: status
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark attendance')
      }

      // Update local state
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, status } : member
      ))

      // Update stats
      updateStats(members.map(member => 
        member.id === memberId ? { ...member, status } : member
      ))

      toast.success(`Marked ${status} for member`)
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error(error.message || 'Failed to mark attendance')
    }
  }

  const markBulkAttendance = async (status) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const records = members
        .filter(member => member.status !== status)
        .map(member => ({
          memberId: member.id,
          status
        }))

      if (records.length === 0) {
        toast.info('No members to update')
        return
      }

      const response = await fetch('http://localhost:3001/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          records
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to mark bulk attendance')
      }

      // Update local state
      setMembers(prev => prev.map(member => ({ ...member, status })))
      updateStats(members.map(member => ({ ...member, status })))

      toast.success(`Marked all members as ${status}`)
    } catch (error) {
      console.error('Error marking bulk attendance:', error)
      toast.error(error.message || 'Failed to mark bulk attendance')
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  return (
    <div className="space-y-6 p-6 mt-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Attendance</h1>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            type="date"
            value={date}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => markBulkAttendance('present')}
              variant="outline"
              className="text-sm px-3 py-1 text-white border-white/10 hover:bg-white/5"
            >
              Mark All Present
            </Button>
            <Button
              onClick={() => markBulkAttendance('absent')}
              variant="outline"
              className="text-sm px-3 py-1 text-white/70 border-white/10 hover:bg-white/5"
            >
              Mark All Absent
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-white">
            Loading attendance data...
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell isHeader className="text-white/70">Member Name</TableCell>
                  <TableCell isHeader className="text-white/70">Status</TableCell>
                  <TableCell isHeader className="text-white/70">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id} className="border-white/10">
                    <TableCell className="text-white">{member.name}</TableCell>
                    <TableCell>
                      <span
                        className="px-2 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: member.status === 'present'
                            ? 'rgba(255, 255, 255, 0.2)'
                            : member.status === 'absent'
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(255, 255, 255, 0.05)',
                          color: member.status === 'present'
                            ? 'white'
                            : member.status === 'absent'
                              ? 'rgba(255, 255, 255, 0.7)'
                              : 'rgba(255, 255, 255, 0.5)'
                        }}
                      >
                        {member.status || 'Not Marked'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => markAttendance(member.id, 'present')}
                          disabled={member.status === 'present'}
                          variant="ghost"
                          className="text-sm px-3 py-1 text-white hover:bg-white/5"
                        >
                          Present
                        </Button>
                        <Button
                          onClick={() => markAttendance(member.id, 'absent')}
                          disabled={member.status === 'absent'}
                          variant="ghost"
                          className="text-sm px-3 py-1 text-white/70 hover:bg-white/5"
                        >
                          Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-white/50">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="ghost"
                  className="text-sm px-3 py-1 text-white/50 hover:text-white"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="ghost"
                  className="text-sm px-3 py-1 text-white/50 hover:text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Total Members
          </h3>
          <p className="text-3xl font-bold text-white">
            {stats.total}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Present Today
          </h3>
          <p className="text-3xl font-bold text-white">
            {stats.present}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Absent Today
          </h3>
          <p className="text-3xl font-bold text-white/70">
            {stats.absent}
          </p>
        </Card>
      </div>
    </div>
  )
} 