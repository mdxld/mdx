"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { ChevronRight } from "lucide-react"

import { cn } from "../../lib/utils.js"
import { Slot } from "@radix-ui/react-slot"

// Constants
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Types
type SidebarState = "expanded" | "collapsed"
type SidebarSide = "left" | "right"
type SidebarVariant = "sidebar" | "floating" | "inset"
type SidebarCollapsible = "offcanvas" | "icon" | "none"

interface SidebarContextValue {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
)

interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  children,
  ...props
}: SidebarProviderProps) {
  const [open, _setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  // Check if we're on the client
  const isClient = typeof window !== "undefined"

  // Set up media query for mobile
  React.useEffect(() => {
    if (!isClient) return

    const mediaQuery = window.matchMedia("(max-width: 768px)")
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
      if (event.matches) {
        setOpenMobile(false)
      }
    }

    setIsMobile(mediaQuery.matches)

    try {
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    } catch (_) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [isClient])

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev)
    } else {
      setOpen((prev) => !prev)
    }
  }, [isMobile, setOpen])

  // Set up keyboard shortcut
  React.useEffect(() => {
    if (!isClient) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT
      ) {
        e.preventDefault()
        toggleSidebar()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isClient, toggleSidebar])

  const state = React.useMemo(
    () => (isMobile ? (openMobile ? "expanded" : "collapsed") : open ? "expanded" : "collapsed"),
    [isMobile, open, openMobile]
  )

  return (
    <SidebarContext.Provider
      value={{
        state,
        open: openProp !== undefined ? openProp : open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      }}
    >
      <div
        className="text-sidebar-foreground"
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
          ...props.style,
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const sidebarVariants = cva(
  "fixed inset-y-0 z-30 flex flex-col bg-sidebar-background border-sidebar-border transition-transform duration-300 ease-in-out",
  {
    variants: {
      side: {
        left: "left-0 border-r",
        right: "right-0 border-l",
      },
      variant: {
        sidebar: "",
        floating: "m-2 rounded-lg shadow-lg",
        inset: "m-2 rounded-lg shadow-lg",
      },
      collapsible: {
        offcanvas: "",
        icon: "",
        none: "",
      },
      state: {
        expanded: "",
        collapsed: "",
      },
    },
    compoundVariants: [
      {
        side: "left",
        variant: "sidebar",
        collapsible: "offcanvas",
        state: "expanded",
        className: "translate-x-0",
      },
      {
        side: "left",
        variant: "sidebar",
        collapsible: "offcanvas",
        state: "collapsed",
        className: "-translate-x-full",
      },
      {
        side: "right",
        variant: "sidebar",
        collapsible: "offcanvas",
        state: "expanded",
        className: "translate-x-0",
      },
      {
        side: "right",
        variant: "sidebar",
        collapsible: "offcanvas",
        state: "collapsed",
        className: "translate-x-full",
      },
      {
        side: "left",
        variant: "sidebar",
        collapsible: "icon",
        state: "expanded",
        className: "w-[--sidebar-width] translate-x-0",
      },
      {
        side: "left",
        variant: "sidebar",
        collapsible: "icon",
        state: "collapsed",
        className: "w-[--sidebar-icon-width] translate-x-0",
      },
      {
        side: "right",
        variant: "sidebar",
        collapsible: "icon",
        state: "expanded",
        className: "w-[--sidebar-width] translate-x-0",
      },
      {
        side: "right",
        variant: "sidebar",
        collapsible: "icon",
        state: "collapsed",
        className: "w-[--sidebar-icon-width] translate-x-0",
      },
      {
        side: "left",
        variant: "sidebar",
        collapsible: "none",
        className: "w-[--sidebar-width] translate-x-0",
      },
      {
        side: "right",
        variant: "sidebar",
        collapsible: "none",
        className: "w-[--sidebar-width] translate-x-0",
      },
      {
        side: "left",
        variant: "floating",
        collapsible: "offcanvas",
        state: "expanded",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "left",
        variant: "floating",
        collapsible: "offcanvas",
        state: "collapsed",
        className: "w-[calc(var(--sidebar-width)-1rem)] -translate-x-full",
      },
      {
        side: "right",
        variant: "floating",
        collapsible: "offcanvas",
        state: "expanded",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "right",
        variant: "floating",
        collapsible: "offcanvas",
        state: "collapsed",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-full",
      },
      {
        side: "left",
        variant: "floating",
        collapsible: "icon",
        state: "expanded",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "left",
        variant: "floating",
        collapsible: "icon",
        state: "collapsed",
        className: "w-[--sidebar-icon-width] translate-x-0",
      },
      {
        side: "right",
        variant: "floating",
        collapsible: "icon",
        state: "expanded",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "right",
        variant: "floating",
        collapsible: "icon",
        state: "collapsed",
        className: "w-[--sidebar-icon-width] translate-x-0",
      },
      {
        side: "left",
        variant: "floating",
        collapsible: "none",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "right",
        variant: "floating",
        collapsible: "none",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "left",
        variant: "inset",
        collapsible: "offcanvas",
        state: "expanded",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "left",
        variant: "inset",
        collapsible: "offcanvas",
        state: "collapsed",
        className: "w-[calc(var(--sidebar-width)-1rem)] -translate-x-full",
      },
      {
        side: "right",
        variant: "inset",
        collapsible: "offcanvas",
        state: "expanded",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "right",
        variant: "inset",
        collapsible: "offcanvas",
        state: "collapsed",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-full",
      },
      {
        side: "left",
        variant: "inset",
        collapsible: "icon",
        state: "expanded",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "left",
        variant: "inset",
        collapsible: "icon",
        state: "collapsed",
        className: "w-[--sidebar-icon-width] translate-x-0",
      },
      {
        side: "right",
        variant: "inset",
        collapsible: "icon",
        state: "expanded",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "right",
        variant: "inset",
        collapsible: "icon",
        state: "collapsed",
        className: "w-[--sidebar-icon-width] translate-x-0",
      },
      {
        side: "left",
        variant: "inset",
        collapsible: "none",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
      {
        side: "right",
        variant: "inset",
        collapsible: "none",
        className: "w-[calc(var(--sidebar-width)-1rem)] translate-x-0",
      },
    ],
    defaultVariants: {
      side: "left",
      variant: "sidebar",
      collapsible: "offcanvas",
      state: "expanded",
    },
  }
)

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SidebarSide
  variant?: SidebarVariant
  collapsible?: SidebarCollapsible
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: SidebarProps) {
  const { state } = useSidebar()

  return (
    <aside
      data-side={side}
      data-variant={variant}
      data-collapsible={collapsible}
      data-state={state}
      className={cn(
        sidebarVariants({
          side,
          variant,
          collapsible,
          state,
        }),
        "text-sidebar-foreground",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

function SidebarHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-14 items-center border-b border-sidebar-border px-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-auto py-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-14 items-center border-t border-sidebar-border px-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-2 py-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

function SidebarGroupLabel({
  asChild = false,
  className,
  children,
  ...props
}: SidebarGroupLabelProps) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      className={cn(
        "mb-1 flex h-8 items-center justify-between px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

function SidebarGroupContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("space-y-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarGroupActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

function SidebarGroupAction({
  className,
  children,
  ...props
}: SidebarGroupActionProps) {
  return (
    <button
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function SidebarMenu({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn("space-y-1", className)}
      {...props}
    >
      {children}
    </ul>
  )
}

function SidebarMenuItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      className={cn("flex items-center", className)}
      {...props}
    >
      {children}
    </li>
  )
}

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
}

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-active={isActive}
      className={cn(
        "peer/menu-button group flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm font-medium ring-offset-sidebar-background transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

interface SidebarMenuActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

function SidebarMenuAction({
  className,
  children,
  ...props
}: SidebarMenuActionProps) {
  return (
    <button
      className={cn(
        "ml-auto flex h-8 w-8 items-center justify-center rounded-md opacity-0 ring-offset-sidebar-background transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 group-hover:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function SidebarMenuSub({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn("ml-4 space-y-1 border-l border-sidebar-border pl-2", className)}
      {...props}
    >
      {children}
    </ul>
  )
}

function SidebarMenuSubItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      className={cn("flex items-center", className)}
      {...props}
    >
      {children}
    </li>
  )
}

interface SidebarMenuSubButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
}

function SidebarMenuSubButton({
  asChild = false,
  isActive = false,
  className,
  children,
  ...props
}: SidebarMenuSubButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-active={isActive}
      className={cn(
        "group flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm font-medium ring-offset-sidebar-background transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  showIcon?: boolean
}) {
  return (
    <div
      className={cn("flex h-8 w-full items-center gap-2 px-2", className)}
      {...props}
    >
      {showIcon && (
        <div className="h-4 w-4 animate-pulse rounded-md bg-sidebar-accent" />
      )}
      <div className="h-4 w-full animate-pulse rounded-md bg-sidebar-accent" />
    </div>
  )
}

function SidebarMenuBadge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "ml-auto flex h-5 items-center rounded-full bg-sidebar-accent px-2 text-xs font-medium text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("my-2 h-px bg-sidebar-border", className)}
      {...props}
    />
  )
}

interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

function SidebarTrigger({
  className,
  children,
  ...props
}: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children || (
        <>
          <span className="sr-only">Toggle Sidebar</span>
          <ChevronRight className="h-4 w-4" />
        </>
      )}
    </button>
  )
}

function SidebarRail({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { toggleSidebar } = useSidebar()
  return (
    <div
      className={cn(
        "absolute inset-y-0 right-0 flex w-1 cursor-col-resize items-center justify-center bg-transparent hover:bg-sidebar-border",
        className
      )}
      onClick={toggleSidebar}
      {...props}
    />
  )
}

function SidebarInset({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useSidebar()
  return (
    <div
      data-state={state}
      className={cn(
        "ml-[calc(var(--sidebar-width)-1rem)] transition-all duration-300 ease-in-out data-[state=collapsed]:ml-[--sidebar-icon-width]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuSkeleton,
  SidebarMenuBadge,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
}
