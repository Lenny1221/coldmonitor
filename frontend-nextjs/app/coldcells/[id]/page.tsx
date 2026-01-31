'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { coldCellsApi, alertsApi } from '@/lib/api'
import { 
  ArrowLeft, 
  Snowflake, 
  Thermometer, 
  Droplets, 
  Zap, 
  DoorOpen,
  Battery
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { format } from 'date-fns'

export default function ColdCellDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [coldCell, setColdCell] = useState<any>(null)
  const [readings, setReadings] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cellData, readingsData, alertsData] = await Promise.all([
          coldCellsApi.getById(id),
          coldCellsApi.getReadings(id, timeRange),
          alertsApi.getAll({ status: 'ACTIVE' }),
        ])
        
        setColdCell(cellData)
        setReadings(readingsData)
        setAlerts(alertsData.filter((a: any) => a.coldCellId === id))
      } catch (error) {
        console.error('Failed to fetch cold cell data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, timeRange])

  if (loading) {
    return (
      <>
        <Topbar title="Cold Cell Details" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    )
  }

  if (!coldCell) {
    return (
      <>
        <Topbar title="Cold Cell Not Found" />
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Cold cell not found</p>
              <Button className="mt-4" onClick={() => router.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const latestDevice = coldCell.devices?.[0]
  const latestReading = latestDevice?.sensorReadings?.[0]

  const chartData = readings?.data?.map((item: any) => ({
    time: format(new Date(item.timestamp), timeRange === '24h' ? 'HH:mm' : 'MMM dd'),
    temperature: item.temperature,
  })) || []

  const getStatusColor = () => {
    if (coldCell._count?.alerts > 0) return 'destructive'
    if (latestReading) {
      const temp = latestReading.temperature
      if (temp > coldCell.temperatureMaxThreshold || temp < coldCell.temperatureMinThreshold) {
        return 'warning'
      }
    }
    return 'success'
  }

  return (
    <>
      <Topbar title="Cold Cell Details" />
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Snowflake className="h-8 w-8 text-primary" />
                {coldCell.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {coldCell.location?.locationName} • {coldCell.type}
              </p>
            </div>
          </div>
          <Badge variant={getStatusColor() as any}>
            {coldCell._count?.alerts > 0 ? 'Critical' : latestReading ? 'Normal' : 'No Data'}
          </Badge>
        </div>

        {/* Live Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Temp</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestReading?.temperature?.toFixed(1) || 'N/A'}°C
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Min: {coldCell.temperatureMinThreshold}°C • Max: {coldCell.temperatureMaxThreshold}°C
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestReading?.humidity?.toFixed(0) || 'N/A'}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Power Status</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={latestReading?.powerStatus ? 'success' : 'destructive'}>
                {latestReading?.powerStatus ? 'ON' : 'OFF'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Door Status</CardTitle>
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={latestReading?.doorStatus ? 'warning' : 'success'}>
                {latestReading?.doorStatus ? 'OPEN' : 'CLOSED'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Battery Level</CardTitle>
              <Battery className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestReading?.batteryLevel || 'N/A'}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Temperature Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Temperature History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList>
                <TabsTrigger value="24h">24 Hours</TabsTrigger>
                <TabsTrigger value="7d">7 Days</TabsTrigger>
                <TabsTrigger value="30d">30 Days</TabsTrigger>
              </TabsList>
              <TabsContent value={timeRange} className="mt-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <ReferenceLine 
                        y={coldCell.temperatureMaxThreshold} 
                        stroke="hsl(var(--destructive))" 
                        strokeDasharray="5 5"
                        label="Max"
                      />
                      <ReferenceLine 
                        y={coldCell.temperatureMinThreshold} 
                        stroke="hsl(var(--primary))" 
                        strokeDasharray="5 5"
                        label="Min"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    No temperature data available
                  </div>
                )}
                {readings?.stats && (
                  <div className="mt-4 flex justify-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Min: </span>
                      <span className="font-semibold">{readings.stats.min}°C</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max: </span>
                      <span className="font-semibold">{readings.stats.max}°C</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg: </span>
                      <span className="font-semibold">{readings.stats.avg.toFixed(1)}°C</span>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Alerts Timeline */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                        {alert.value && (
                          <span className="text-sm">
                            {alert.value}°C (Threshold: {alert.threshold}°C)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.triggeredAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await alertsApi.resolve(alert.id)
                        // Refresh alerts
                        const updated = await alertsApi.getAll({ status: 'ACTIVE' })
                        setAlerts(updated.filter((a: any) => a.coldCellId === id))
                      }}
                    >
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
