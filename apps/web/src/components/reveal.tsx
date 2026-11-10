import type { HTMLAttributes } from "react";

export function Reveal({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}
