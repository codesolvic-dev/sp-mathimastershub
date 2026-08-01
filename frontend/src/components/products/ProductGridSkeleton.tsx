import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { spItemCard } from "@/utils/spStandards";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={spItemCard.gridClassName} style={{ rowGap: `${spItemCard.gridRowGapPx}px` }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="space-y-3">
          <Skeleton className="w-full aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

