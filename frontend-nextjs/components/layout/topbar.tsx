'use client'

import { Bell, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { authApi } from '@/lib/api'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const [user, setUser] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authApi.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }
    fetchUser()
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 lg:ml-64">
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        
        <div className="flex items-center gap-4">
          {/* Notifications (future) */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* User menu */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden md:block">
                {user?.profile?.contactName || user?.profile?.name || user?.email}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border bg-card shadow-lg">
                <div className="p-2">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.email}
                  </div>
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    {user?.role}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
