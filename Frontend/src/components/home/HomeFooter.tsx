import { Link } from "react-router-dom"
import { AppLogo } from "@/components/AppLogo"

type FooterColumn = {
  title: string
  links: readonly { label: string; to: string }[]
}

const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "How it works", to: "/#how-it-works" },
      { label: "Pricing", to: "/#pricing" },
      { label: "FAQ", to: "/#faq" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Tailor resume", to: "/tailor" },
      { label: "Resume builder", to: "/builder" },
      { label: "Templates", to: "/templates" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Log in", to: "/login" },
      { label: "Sign up", to: "/signup" },
    ],
  },
]

export function HomeFooter() {
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-5">
            <AppLogo size="sm" className="self-start" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Tailor your resume to every job description—without starting from scratch.
            </p>
          </div>

          {/* Link groups */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7"
          >
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 text-sm text-muted-foreground/80 sm:flex-row md:mt-16">
          <p>© {new Date().getFullYear()} JobResumeAI. All rights reserved.</p>
          <p className="text-xs">Built for people who write their own resumes.</p>
        </div>
      </div>
    </footer>
  )
}
