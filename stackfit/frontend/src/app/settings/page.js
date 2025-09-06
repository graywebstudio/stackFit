'use client'
import Link from 'next/link'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Admin Management</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Manage administrator accounts and permissions.
            </p>
            <Link href="/register">
              <Button className="w-full">
                Add New Admin
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">System Settings</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Configure system-wide settings and preferences.
            </p>
            {/* Add more settings options here */}
          </div>
        </Card>
      </div>
    </div>
  )
} 