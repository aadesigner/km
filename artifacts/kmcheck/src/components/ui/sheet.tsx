"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & { fast?: boolean }
>(({ className, fast, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80",
      fast
        ? "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-300 data-[state=closed]:duration-220"
        : "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
      speed: {
        default: cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
        ),
        // Mobile nav: iOS-like spring slide. Opacity stays on the overlay only.
        fast: cn(
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "data-[state=closed]:duration-220 data-[state=open]:duration-320",
          "data-[state=open]:translate-x-0 data-[state=open]:translate-y-0",
        ),
      },
    },
    compoundVariants: [
      {
        side: "top",
        speed: "default",
        class: "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
      },
      {
        side: "bottom",
        speed: "default",
        class: "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      },
      {
        side: "left",
        speed: "default",
        class: "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
      },
      {
        side: "right",
        speed: "default",
        class: "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
      },
      {
        side: "right",
        speed: "fast",
        class: "data-[state=closed]:translate-x-full",
      },
      {
        side: "left",
        speed: "fast",
        class: "data-[state=closed]:-translate-x-full",
      },
      {
        side: "top",
        speed: "fast",
        class: "data-[state=closed]:-translate-y-full",
      },
      {
        side: "bottom",
        speed: "fast",
        class: "data-[state=closed]:translate-y-full",
      },
    ],
    defaultVariants: {
      side: "right",
      speed: "default",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  overlayClassName?: string
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", speed = "default", className, overlayClassName, children, onPointerDownOutside, onInteractOutside, onCloseAutoFocus, ...props }, ref) => {
  const isFast = speed === "fast"
  const openedAtRef = React.useRef(0)
  const [overlayArmed, setOverlayArmed] = React.useState(!isFast)

  React.useEffect(() => {
    if (!isFast) return
    openedAtRef.current = Date.now()
    setOverlayArmed(false)
    const id = window.setTimeout(() => setOverlayArmed(true), 380)
    return () => window.clearTimeout(id)
  }, [isFast])

  const ignoreOpeningGesture = (event: Event) => {
    if (isFast && Date.now() - openedAtRef.current < 400) {
      event.preventDefault()
    }
  }

  return (
    <SheetPortal>
      <SheetOverlay
        fast={isFast}
        className={cn(
          isFast && "bg-black/45 backdrop-blur-[2px]",
          isFast && !overlayArmed && "pointer-events-none",
          overlayClassName,
        )}
      />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side, speed }), className)}
        onPointerDownOutside={(event) => {
          ignoreOpeningGesture(event)
          onPointerDownOutside?.(event)
        }}
        onInteractOutside={(event) => {
          ignoreOpeningGesture(event)
          onInteractOutside?.(event)
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onCloseAutoFocus?.(event)
        }}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
