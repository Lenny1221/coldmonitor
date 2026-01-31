'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { coldCellsApi, locationsApi } from '@/lib/api'
import { Snowflake, ArrowRight, Plus } from 'lucide-react'

export default function ColdCellsPage() {
  const router = useRouter()
  const [coldCells, setColdCells] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'fridge' as 'fridge' | 'freezer',
    temperatureMinThreshold: 2,
    temperatureMaxThreshold: 8,
    locationId: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [cellsData, locationsData] = await Promise.all([
        coldCellsApi.getAll(),
        locationsApi.getAll(),
      ])
      setColdCells(cellsData)
      setLocations(locationsData)
      if (locationsData.length > 0 && !formData.locationId) {
        setFormData(prev => ({ ...prev, locationId: locationsData[0].id }))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateColdCell = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.locationId) {
      alert('Please select a location first')
      return
    }
    setCreating(true)
    try {
      await coldCellsApi.create({
        ...formData,
        locationId: formData.locationId,
      })
      setShowCreateDialog(false)
      setFormData({
        name: '',
        type: 'fridge',
        temperatureMinThreshold: 2,
        temperatureMaxThreshold: 8,
        locationId: locations[0]?.id || '',
      })
      fetchData()
    } catch (error: any) {
      console.error('Failed to create cold cell:', error)
      alert(error.response?.data?.error || 'Failed to create cold cell')
    } finally {
      setCreating(false)
    }
  }

  const getStatusBadge = (cell: any) => {
    if (cell._count?.alerts > 0) {
      return <Badge variant="destructive">Critical</Badge>
    }
    const latestReading = cell.devices?.[0]?.sensorReadings?.[0]
    if (latestReading) {
      const temp = latestReading.temperature
      if (temp > cell.temperatureMaxThreshold || temp < cell.temperatureMinThreshold) {
        return <Badge variant="warning">Warning</Badge>
      }
    }
    return <Badge variant="success">Normal</Badge>
  }

  return (
    <>
      <Topbar title="Cold Cells" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Cold Cells</h2>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            disabled={locations.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Cold Cell
          </Button>
        </div>

        {locations.length === 0 && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                You need to create a location first before adding cold cells.
              </p>
              <Button onClick={() => router.push('/locations')}>
                Go to Locations
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Cold Cell Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Current Temp</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Loading cold cells...
                      </td>
                    </tr>
                  ) : coldCells.length > 0 ? (
                    coldCells.map((cell) => {
                      const latestReading = cell.devices?.[0]?.sensorReadings?.[0]
                      return (
                        <tr key={cell.id} className="border-b hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Snowflake className="h-4 w-4 text-primary" />
                              <span className="font-medium">{cell.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {cell.location?.locationName || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            {latestReading ? (
                              <span className="font-medium">
                                {latestReading.temperature.toFixed(1)}°C
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(cell)}</td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/coldcells/${cell.id}`)}
                            >
                              View Details
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No cold cells found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create Cold Cell Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Cold Cell</DialogTitle>
              <DialogDescription>
                Add a new refrigeration or freezer unit to monitor
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateColdCell} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Cold Cell Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Freezer 1, Fridge 2"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location *
                </label>
                <select
                  id="location"
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.locationName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Type *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fridge' | 'freezer' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="fridge">Fridge</option>
                  <option value="freezer">Freezer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="minTemp" className="text-sm font-medium">
                    Min Temperature (°C) *
                  </label>
                  <Input
                    id="minTemp"
                    type="number"
                    step="0.1"
                    value={formData.temperatureMinThreshold}
                    onChange={(e) => setFormData({ ...formData, temperatureMinThreshold: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxTemp" className="text-sm font-medium">
                    Max Temperature (°C) *
                  </label>
                  <Input
                    id="maxTemp"
                    type="number"
                    step="0.1"
                    value={formData.temperatureMaxThreshold}
                    onChange={(e) => setFormData({ ...formData, temperatureMaxThreshold: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !formData.locationId}>
                  {creating ? 'Creating...' : 'Create Cold Cell'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
