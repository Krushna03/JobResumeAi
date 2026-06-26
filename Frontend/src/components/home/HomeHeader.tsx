import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { AppLogo } from "@/components/AppLogo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Menu, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
const navLinkClass =
  "text-base text-foreground font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"

const mobileLinkClass =
  "rounded-lg px-3 py-3 text-base text-foreground/80 hover:bg-white/5 hover:text-foreground"

const SCROLL_THRESHOLD_PX = 16

export function HomeHeader() {
  const { user, logout, isLoading } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > SCROLL_THRESHOLD_PX)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD_PX)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const showSolidBar = isScrolled || mobileNavOpen

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter,border-color] duration-300",
        showSolidBar
          ? "border-b border-border bg-background/85 shadow-sm backdrop-blur-md"
          : "!border-b-0 border-transparent !bg-transparent shadow-none backdrop-blur-0"
      )}
    >
      <div className="relative mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 md:h-[4.25rem] lg:px-8">
        <AppLogo
          size="md"
          className={cn(
            "shrink-0 focus-visible:ring-offset-2",
            showSolidBar ? "focus-visible:ring-offset-background" : "focus-visible:ring-offset-transparent",
          )}
        />

        <nav
          className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex"
          aria-label="Primary"
        >
          <Link to="/#features" className={cn(navLinkClass, "pointer-events-auto")}>
            Features
          </Link>
          <Link to="/#how-it-works" className={cn(navLinkClass, "pointer-events-auto")}>
            How it works
          </Link>
          <Link to="/#pricing" className={cn(navLinkClass, "pointer-events-auto")}>
            Pricing
          </Link>
          <Link to="/#faq" className={cn(navLinkClass, "pointer-events-auto")}>
            FAQ
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!isLoading && user ? (
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Go to dashboard"
                title="Dashboard"
                className="rounded-full text-muted-foreground p-1.5 hover:bg-white/10 hover:text-foreground"
                asChild
              >
                  <User className="h-8 w-8 shrink-0 opacity-90" aria-hidden />
              </Button>
            </Link>
          ) : !isLoading ? (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-white/10 hover:text-foreground" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full border-border bg-transparent hover:bg-white/10" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          ) : null}
          <ThemeToggle />
          <Button size="sm" className="rounded-full border-0 px-5 gradient-primary text-white hover:opacity-90" asChild>
            <Link to="/tailor">Align Resume to JD</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-white/10"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {mobileNavOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-background/95 backdrop-blur-md md:hidden"
        >
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8" aria-label="Mobile">
            <Link to="/#features" className={mobileLinkClass} onClick={() => setMobileNavOpen(false)}>
              Features
            </Link>
            <Link to="/#how-it-works" className={mobileLinkClass} onClick={() => setMobileNavOpen(false)}>
              How it works
            </Link>
            <Link to="/#pricing" className={mobileLinkClass} onClick={() => setMobileNavOpen(false)}>
              Pricing
            </Link>
            <Link to="/#faq" className={mobileLinkClass} onClick={() => setMobileNavOpen(false)}>
              FAQ
            </Link>
            {!isLoading && user ? (
              <>
                <Link to="/dashboard" className={mobileLinkClass} onClick={() => setMobileNavOpen(false)}>
                  Dashboard
                </Link>
                <button
                  type="button"
                  className={`${mobileLinkClass} w-full text-left`}
                  onClick={() => {
                    setMobileNavOpen(false)
                    void logout()
                  }}
                >
                  Log out
                </button>
              </>
            ) : !isLoading ? (
              <>
                <Link to="/login" className={mobileLinkClass} onClick={() => setMobileNavOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className={mobileLinkClass} onClick={() => setMobileNavOpen(false)}>
                  Sign up
                </Link>
              </>
            ) : null}
            <Link
              to="/tailor"
              className="mt-2 rounded-full px-4 py-3 text-center text-sm font-medium gradient-primary text-white hover:opacity-90"
              onClick={() => setMobileNavOpen(false)}
            >
              Try the tool
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
