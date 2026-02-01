import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLikedCars, likeCar, unlikeCar } from '@/api/cars'
import type { Car } from '@/types'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/store/auth'

export function useFavorites() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data: likedCars = [], isLoading } = useQuery<Car[]>({
    queryKey: ['liked-cars'],
    queryFn: async () => {
      if (!isAuthenticated) return []
      const response = await getLikedCars()
      return response.items || []
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Create a Set for O(1) lookups
  const likedSet = new Set(likedCars.map((car) => car.id))

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isLiked }: { id: number; isLiked: boolean; car?: Car }) => {
      if (!isAuthenticated) {
        throw new Error('Unauthorized')
      }
      if (isLiked) {
        await unlikeCar(id)
        return { id, action: 'removed' }
      } else {
        await likeCar(id)
        return { id, action: 'added' }
      }
    },
    onMutate: async ({ id, isLiked, car }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['liked-cars'] })

      // Snapshot the previous value
      const previousLikedCars = queryClient.getQueryData<Car[]>(['liked-cars'])

      // Optimistically update to the new value
      queryClient.setQueryData<Car[]>(['liked-cars'], (old) => {
        const currentList = Array.isArray(old) ? old : []
        
        if (isLiked) {
          // Removing
          return currentList.filter((c) => c.id !== id)
        } else {
          // Adding
          // If we have the car object, add it. Otherwise, adding just ID might be risky for UI rendering,
          // but valid for "isLiked" checks.
          // To be safe, if we don't have full car data, we might choose NOT to add it to the list 
          // (so it won't appear in Favorites page until refetch), but we still want the button to update.
          // However, isLiked check relies on this list.
          // Let's add it if car is provided, or a placeholder if not.
          const newCar: Car = car || { id } as Car
          return [...currentList, newCar]
        }
      })

      return { previousLikedCars }
    },
    onError: (err, _variables, context) => {
      if (err.message === 'Unauthorized') {
        toast.error('Please login to manage favorites')
        return
      }
      if (context?.previousLikedCars) {
        queryClient.setQueryData<Car[]>(['liked-cars'], context.previousLikedCars)
      }
      toast.error('Failed to update favorites')
    },
    onSuccess: (data) => {
      const message = data.action === 'added' ? 'Added to favorites' : 'Removed from favorites'
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ['liked-cars'] })
    },
  })

  const isLiked = (id: number) => likedSet.has(id)

  const toggleLike = (id: number, car?: Car) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to favorites')
      // Redirect or open modal could go here
      return
    }
    toggleMutation.mutate({ id, isLiked: isLiked(id), car })
  }

  const clearMutation = useMutation({
    mutationFn: async (carsToClear: Car[]) => {
      if (!isAuthenticated) throw new Error('Unauthorized')
      const promises = carsToClear.map((car) => unlikeCar(car.id))
      await Promise.all(promises)
      return carsToClear.length
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['liked-cars'] })
      const previousLikedCars = queryClient.getQueryData<Car[]>(['liked-cars'])
      queryClient.setQueryData<Car[]>(['liked-cars'], [])
      return { previousLikedCars }
    },
    onError: (_err, _ignored, context) => {
      if (context?.previousLikedCars) {
        queryClient.setQueryData<Car[]>(['liked-cars'], context.previousLikedCars)
      }
      toast.error('Failed to clear favorites')
    },
    onSuccess: () => {
      toast.success('All favorites cleared')
      queryClient.invalidateQueries({ queryKey: ['liked-cars'] })
    },
  })

  const clearFavorites = () => {
    if (!isAuthenticated) return
    if (likedCars.length === 0) return
    
    if (confirm('Are you sure you want to remove all favorites?')) {
      clearMutation.mutate(likedCars)
    }
  }

  return {
    likedCars,
    isLoading,
    isLiked,
    toggleLike,
    clearFavorites,
    isToggling: toggleMutation.isPending,
    isClearing: clearMutation.isPending
  }
}
