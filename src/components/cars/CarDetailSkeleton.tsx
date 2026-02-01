import { Card, CardContent } from '@/components/ui/card'

export function CarDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 pt-[80px] md:pt-6">
      {/* Breadcrumbs skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Images & Details */}
        <div className="order-1 lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-0 bg-transparent shadow-none">
            <div className="p-1.5 sm:p-2">
              <div className="flex gap-1 sm:gap-1.5 md:h-[360px] lg:h-[380px] xl:h-[420px]">
                {/* Main image skeleton */}
                <div className="relative flex-1 rounded-xl overflow-hidden bg-muted animate-pulse aspect-[4/3] sm:aspect-[16/9] md:aspect-auto md:h-full" />
                
                {/* Thumbnails skeleton */}
                <div className="hidden md:flex flex-col gap-1 w-12 lg:w-14 xl:w-16 h-full pl-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full aspect-square rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Description skeleton */}
              <div className="mt-8 space-y-4">
                <div className="h-8 w-40 bg-muted animate-pulse rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column - Price & Actions */}
        <div className="order-2 lg:col-start-3 lg:row-start-1 flex flex-col gap-4 h-fit">
          <Card className="rounded-xl">
            <CardContent className="p-6 space-y-6">
              {/* Title & Price */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
                  <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 w-32 bg-muted animate-pulse rounded" />
              </div>

              {/* Key specs */}
              <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="space-y-3 hidden md:block">
                <div className="h-12 w-full bg-muted animate-pulse rounded-lg" />
                <div className="h-12 w-full bg-muted animate-pulse rounded-lg" />
              </div>

              {/* Stats */}
              <div className="pt-4 border-t flex gap-4">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>

          {/* Seller card skeleton */}
          <Card className="overflow-hidden h-fit rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
