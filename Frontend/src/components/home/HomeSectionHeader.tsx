import { cn } from "@/lib/utils"

type HomeSectionHeaderProps = {
  title: string
  description?: string
  className?: string
  titleClassName?: string
  maxWidthClassName?: string
}

export function HomeSectionHeader({
  title,
  description,
  className,
  titleClassName,
  maxWidthClassName = "max-w-2xl",
}: HomeSectionHeaderProps) {
  return (
    <div className={cn("mx-auto text-center", maxWidthClassName, className)}>
      <h2
        className={cn(
          "font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl",
          titleClassName
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">{description}</p>
      ) : null}
    </div>
  )
}
