'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { dashboardApi } from '@/lib/api'
import { Users, Snowflake, AlertTriangle, WifiOff, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default function TechnicianDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await dashboardApi.getTechnicianDashboard()
        setData(dashboardData)
      } catch (error) {
        console.error('Failed to fetch technician dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <>
        <Topbar title="Technician Dashboard" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    )
  }

  const summary = data?.summary || {}
  const alerts = data?.alerts || []

  return (
    <>
      <Topbar title="Technician Dashboard" />
      <main className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCustomers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cold Cells</CardTitle>
              <Snowflake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalColdCells || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {summary.totalAlarms || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Devices</CardTitle>
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.offlineDevices || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Alerts Across All Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.slice(0, 10).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                        <span className="font-medium">
                          {alert.coldCell?.location?.customer?.companyName}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {alert.coldCell?.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.triggeredAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/coldcells/${alert.coldCellId}`)}
                    >
                      View
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No alerts found
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
