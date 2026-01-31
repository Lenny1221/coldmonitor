'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { locationsApi } from '@/lib/api'
import { MapPin, ArrowRight, Plus } from 'lucide-react'

export default function LocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [address, setAddress] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const data = await locationsApi.getAll()
      setLocations(data)
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await locationsApi.create({
        locationName,
        address: address || undefined,
      })
      setShowCreateDialog(false)
      setLocationName('')
      setAddress('')
      fetchLocations()
    } catch (error: any) {
      console.error('Failed to create location:', error)
      alert(error.response?.data?.error || 'Failed to create location')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Topbar title="Locations" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Locations</h2>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading locations...
            </div>
          ) : locations.length > 0 ? (
            locations.map((location) => (
              <Card key={location.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{location.locationName}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {location.address && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {location.address}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {location.coldCells?.length || 0} cold cell{location.coldCells?.length !== 1 ? 's' : ''}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/locations/${location.id}`)}
                    >
                      View
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No locations found</p>
            </div>
          )}
        </div>

        {/* Create Location Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
              <DialogDescription>
                Add a new location where you have refrigeration units
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="locationName" className="text-sm font-medium">
                  Location Name *
                </label>
                <Input
                  id="locationName"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Main Store, Warehouse"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address (Optional)
                </label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Location'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
