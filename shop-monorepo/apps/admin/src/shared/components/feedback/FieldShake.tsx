import type { FieldError } from "react-hook-form"
import { cn } from "@/shared/lib/utils"
import { useShakeOnError } from "@/shared/hooks/useShakeOnError"

interface FieldShakeProps {
  error?: FieldError
  children: React.ReactNode
  className?: string
}

/** دور هر Input/Select/Textarea بپیچش؛ روی خطای فیلد shake+glow قرمز میده. */
export function FieldShake({ error, children, className }: FieldShakeProps) {
  const shaking = useShakeOnError(error)

  return (
    <div className={cn(shaking && "feedback-shake", className)}>
      {children}
    </div>
  )
}