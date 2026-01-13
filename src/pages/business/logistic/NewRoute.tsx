import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NewRoute() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          to="/biz/logistic/dashboard" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Create New Route</h1>
        <p className="text-muted-foreground mt-2">Set up a new shipping route for your fleet.</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Route Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Input placeholder="City, Country" />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input placeholder="City, Country" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Input placeholder="e.g. Car Carrier, Flatbed" />
            </div>
            <div className="pt-4">
              <Button className="w-full">Create Route</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
