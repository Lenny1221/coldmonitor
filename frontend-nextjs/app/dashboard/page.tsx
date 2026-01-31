'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dashboardApi, alertsApi } from '@/lib/api'
import { 
  Snowflake, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  TrendingUp 
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await dashboardApi.getCustomerDashboard()
        setData(dashboardData)

        const alerts = await alertsApi.getAll({ status: 'ACTIVE' })
        setRecentAlerts(alerts.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  if (loading) {
    return (
      <>
        <Topbar title="Dashboard" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    )
  }

  const summary = data?.summary || {}
  const coldCells = summary.coldCells || []

  // Calculate device stats
  const devicesOnline = coldCells.reduce((acc: number, cell: any) => {
    return acc + (cell.devices?.filter((d: any) => d.status === 'ONLINE').length || 0)
  }, 0)
  const devicesOffline = coldCells.reduce((acc: number, cell: any) => {
    return acc + (cell.devices?.filter((d: any) => d.status === 'OFFLINE').length || 0)
  }, 0)

  // Prepare chart data (mock for now - would come from readings API)
  const chartData = Array.from({ length: 24 }, (_, i) => ({
    time: format(new Date(Date.now() - (23 - i) * 60 * 60 * 1000), 'HH:mm'),
    temperature: 4 + Math.random() * 2,
  }))

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'HIGH_TEMP':
      case 'LOW_TEMP':
        return 'warning'
      case 'POWER_LOSS':
      case 'SENSOR_ERROR':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {summary.activeAlarms || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Online</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{devicesOnline}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Offline</CardTitle>
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devicesOffline}</div>
            </CardContent>
          </Card>
        </div>

        {/* Temperature Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Temperature Overview (Last 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length > 0 ? (
              <div className="space-y-2">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getAlertTypeColor(alert.type) as any}>
                          {alert.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-medium">
                          {alert.coldCell?.name || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.triggeredAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <Badge variant={alert.status === 'ACTIVE' ? 'destructive' : 'success'}>
                      {alert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent alerts
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
