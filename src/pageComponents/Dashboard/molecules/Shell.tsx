import * as React from "react";
import { cn } from "~/utils/cn";

type DashboardShellProps = React.HTMLAttributes<HTMLDivElement>;

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div
      className={cn("flex flex-col gap-6 px-1 md:gap-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}
