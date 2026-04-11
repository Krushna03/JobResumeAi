import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 bg-app-mesh" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
