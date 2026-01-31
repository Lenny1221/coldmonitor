'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { alertsApi } from '@/lib/api'
import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await alertsApi.getAll()
        setAlerts(data)
        setFilteredAlerts(data)
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  useEffect(() => {
    let filtered = alerts

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter.toUpperCase())
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter)
    }

    setFilteredAlerts(filtered)
  }, [statusFilter, typeFilter, alerts])

  const handleResolve = async (alertId: string) => {
    try {
      await alertsApi.resolve(alertId)
      const updated = await alertsApi.getAll()
      setAlerts(updated)
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

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
      <Topbar title="Alerts" />
      <main className="p-6">
        <Card>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="HIGH_TEMP">High Temperature</option>
                  <option value="LOW_TEMP">Low Temperature</option>
                  <option value="POWER_LOSS">Power Loss</option>
                  <option value="SENSOR_ERROR">Sensor Error</option>
                </select>
              </div>
            </div>

            {/* Alerts Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Cold Cell</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Alert Type</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        Loading alerts...
                      </td>
                    </tr>
                  ) : filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <tr key={alert.id} className="border-b hover:bg-muted/50">
                        <td className="px-6 py-4 text-sm">
                          {format(new Date(alert.triggeredAt), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {alert.coldCell?.location?.locationName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {alert.coldCell?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getAlertTypeColor(alert.type) as any}>
                            {alert.type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={alert.status === 'ACTIVE' ? 'destructive' : 'success'}>
                            {alert.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {alert.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolve(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No alerts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
