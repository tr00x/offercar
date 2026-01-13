import { Link } from 'react-router-dom'
import { CarCard } from '@/components/cars/CarCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Heart, Search, Trash2 } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'

export function Favorites() {
  const { likedCars: cars, isLoading, clearFavorites, isClearing } = useFavorites()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Favorites</h1>
        {cars.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={clearFavorites}
            disabled={isClearing}
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        )}
      </div>

      {cars.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Save cars you like to find them easily later
            </p>
            <Button asChild>
              <Link to="/">
                <Search className="h-4 w-4 mr-2" />
                Browse cars
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">
            {cars.length} {cars.length === 1 ? 'car' : 'cars'} saved
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
