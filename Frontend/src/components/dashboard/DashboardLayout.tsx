import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, ChevronDown } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const sidebarLinkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-sm">
        <div className="flex h-16 items-center border-b border-sidebar-border px-3">
          <AppLogo size="sm" className="min-w-0 [&_span]:truncate" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Dashboard">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              cn(
                sidebarLinkClass,
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
            Dashboard
          </NavLink>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-end gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <ThemeToggle />
          {!isLoading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <span className="max-w-[10rem] truncate text-sm">
                    {user.username || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/">Back to site</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void logout()}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
