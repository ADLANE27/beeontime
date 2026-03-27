
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface ContentSkeletonProps {
  className?: string;
}

export function TableSkeleton({ className }: ContentSkeletonProps) {
  return (
    <div className={cn("space-y-3 animate-fade-in", className)}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded-lg shimmer" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-4 border-t border-border/40"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <Skeleton className="h-4 w-8 rounded-lg shimmer" />
          <Skeleton className="h-4 flex-1 rounded-lg shimmer" />
          <Skeleton className="h-4 flex-1 rounded-lg shimmer" />
          <Skeleton className="h-4 w-20 rounded-lg shimmer" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ className }: ContentSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in", className)}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/40 p-5 space-y-4"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shimmer" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4 rounded-lg shimmer" />
              <Skeleton className="h-3 w-1/2 rounded-lg shimmer" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-lg shimmer" />
            <Skeleton className="h-3 w-2/3 rounded-lg shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ className }: ContentSkeletonProps) {
  return (
    <div className={cn("space-y-3 animate-fade-in", className)}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl border border-border/40"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <Skeleton className="h-10 w-10 rounded-xl shimmer" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3 rounded-lg shimmer" />
            <Skeleton className="h-3 w-1/2 rounded-lg shimmer" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg shimmer" />
        </div>
      ))}
    </div>
  );
}

export function StatCardsSkeleton({ className }: ContentSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in", className)}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/40 p-5 space-y-3"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shimmer" />
            <Skeleton className="h-3 w-20 rounded-lg shimmer" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg shimmer" />
        </div>
      ))}
    </div>
  );
}
