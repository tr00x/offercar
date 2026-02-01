import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CarCardSkeletonProps {
  variant?: 'grid' | 'list'
}

export function CarCardSkeleton({ variant = 'grid' }: CarCardSkeletonProps) {
  const isList = variant === 'list'

  return (
    <Card
      className={cn(
        'group overflow-hidden border-border bg-card',
        isList ? '' : ''
      )}
    >
      <div className={cn(isList ? 'flex gap-3 md:gap-4' : '')}>
        <div
          className={cn('relative', isList && 'w-24 sm:w-28 md:w-56 flex-shrink-0')}
        >
          <div
            className={cn(
              'relative overflow-hidden bg-muted animate-pulse',
              isList
                ? 'aspect-[16/9] md:aspect-[4/3] rounded-md border border-white/15'
                : 'aspect-[16/9] md:aspect-[3/2]'
            )}
          />
        </div>

        <div
          className={cn(
            isList
              ? 'flex flex-col flex-1 p-3 md:p-4 space-y-2.5 md:space-y-4'
              : 'p-3 space-y-3 md:p-4 md:space-y-4'
          )}
        >
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 w-full space-y-2">
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-6 w-1/3 bg-muted animate-pulse rounded mt-1" />
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
             <div className="h-3 w-16 bg-muted animate-pulse rounded" />
             <div className="h-3 w-12 bg-muted animate-pulse rounded" />
             <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 w-full">
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              <span className="h-3 w-px bg-border" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
