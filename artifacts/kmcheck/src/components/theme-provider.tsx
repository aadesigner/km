import { createContext, useContext, useLayoutEffect, useState, useCallback } from "react"

type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

function readStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme
  return (localStorage.getItem(storageKey) as Theme) || defaultTheme
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (typeof window === "undefined") return "light"
  if (theme === "dark") return "dark"
  if (theme === "light") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** Apply class on <html> immediately — no transition flash */
function applyThemeClass(resolved: ResolvedTheme) {
  const root = window.document.documentElement
  root.classList.add("disable-transitions")
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
  // Force style recalc so the disable-transitions class applies before paint
  void root.offsetHeight
  root.classList.remove("disable-transitions")
}

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    readStoredTheme(storageKey, defaultTheme),
  )
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredTheme(storageKey, defaultTheme)),
  )

  const commitTheme = useCallback((next: Theme) => {
    const resolved = resolveTheme(next)
    applyThemeClass(resolved)
    setResolvedTheme(resolved)
    setThemeState(next)
  }, [])

  // Sync DOM on mount (handles SSR/hydration edge) and system preference changes
  useLayoutEffect(() => {
    applyThemeClass(resolveTheme(theme))

    if (theme !== "system") return

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const next = mq.matches ? "dark" : "light"
      applyThemeClass(next)
      setResolvedTheme(next)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(storageKey, next)
    commitTheme(next)
  }, [storageKey, commitTheme])

  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
