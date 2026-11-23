import * as React from "react";
import { cn } from "cn";

function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none text-slate-700 dark:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
