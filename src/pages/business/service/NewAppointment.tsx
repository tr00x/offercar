import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NewAppointment() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          to="/biz/service/dashboard" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">New Appointment</h1>
        <p className="text-muted-foreground mt-2">Schedule a new service appointment.</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input placeholder="Client's full name" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+993..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Input placeholder="e.g. Oil Change, Diagnostics" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional details..." />
            </div>
            <div className="pt-4">
              <Button className="w-full">Schedule Appointment</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
