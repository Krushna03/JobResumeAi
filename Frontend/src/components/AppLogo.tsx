import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeStyles = {
  sm: { icon: "h-7 w-7", text: "text-lg" },
  md: { icon: "h-8 w-8", text: "text-xl" },
  lg: { icon: "h-9 w-9", text: "text-xl" },
} as const;

type AppLogoProps = {
  to?: string;
  size?: keyof typeof sizeStyles;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function AppLogo({
  to = "/",
  size = "md",
  className,
  iconClassName,
  textClassName,
}: AppLogoProps) {
  const s = sizeStyles[size];
  return (
    <Link
      to={to}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-md font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Brain className={cn(s.icon, "shrink-0 text-primary", iconClassName)} aria-hidden />
      <span className={cn("font-headline font-semibold", s.text, textClassName)}>JobResumeAI</span>
    </Link>
  );
}
