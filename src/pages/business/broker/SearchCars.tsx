import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SearchCars() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          to="/biz/broker/dashboard" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Find Cars</h1>
        <p className="text-muted-foreground mt-2">Search and request cars for your clients.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by make, model, or year..." />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button>Search</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder for results */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>Enter search criteria to find cars</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
