import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface CollectionBadgeProps {
  name: string
  color: string
  className?: string
}

export const CollectionBadge = React.memo(function CollectionBadge({ name, color, className }: CollectionBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <div
        aria-hidden="true"
        className="size-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
    </Badge>
  )
})
