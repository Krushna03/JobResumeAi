import { Link } from "react-router-dom"
import { AppLogo } from "@/components/AppLogo"

export function HomeFooter() {
  return (
    <footer>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <AppLogo size="sm" className="self-start" />
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <Link to="/#features" className="transition-colors hover:text-foreground">
              Features
            </Link>
            <Link to="/tailor" className="transition-colors hover:text-foreground">
              Tailor resume
            </Link>
            <Link to="/#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link to="/#faq" className="transition-colors hover:text-foreground">
              FAQ
            </Link>
            <Link to="/templates" className="transition-colors hover:text-foreground">
              Templates
            </Link>
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="mt-10 pt-8 text-center text-sm text-muted-foreground/80 md:mt-12">
          © {new Date().getFullYear()} JobResumeAI. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
