"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

interface CopyButtonProps extends ButtonProps {
  value: string
  onCopy?: () => void
}

export function CopyButton({
  value,
  className,
  variant = "ghost",
  size = "icon",
  onCopy,
  children,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setHasCopied(true)
      onCopy?.()
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }

    setTimeout(() => {
      setHasCopied(false)
    }, 2000)
  }, [value, onCopy])

  return (
    <Button
      size={size}
      variant={variant}
      className={cn("relative z-10", className)}
      onClick={handleCopy}
      aria-label={children ? undefined : (hasCopied ? "Copiado" : "Copiar")}
      {...props}
    >
      {hasCopied ? (
        <Check className={cn("h-4 w-4", children ? "mr-2" : "")} />
      ) : (
        <Copy className={cn("h-4 w-4", children ? "mr-2" : "")} />
      )}
      {children}
    </Button>
  )
}
