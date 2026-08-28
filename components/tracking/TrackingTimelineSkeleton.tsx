import { Skeleton } from "@/components/ui/Skeleton";

export interface TrackingTimelineSkeletonProps {
  /** Number of stage rows to render. Defaults to 5, matching the real timeline's stage count. */
  rows?: number;
  className?: string;
}

/**
 * Placeholder for a tracking timeline: a stack of circle-and-two-lines rows
 * that reserves the same vertical space as the real timeline so it can mount
 * without a layout shift.
 */
export default function TrackingTimelineSkeleton({
  rows = 5,
  className = "",
}: TrackingTimelineSkeletonProps) {
  return (
    <div
      className={`space-y-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading tracking status"
    >
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
