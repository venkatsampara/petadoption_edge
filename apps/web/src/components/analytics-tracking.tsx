"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function AnalyticsEventOnMount({
  event,
  parameters = {},
}: {
  event: string;
  parameters?: Record<string, unknown>;
}) {
  const serializedParameters = JSON.stringify(parameters);
  useEffect(() => {
    trackEvent(event, JSON.parse(serializedParameters) as Record<string, unknown>);
  }, [event, serializedParameters]);
  return null;
}

export function TrackedExternalLink({
  href,
  event,
  parameters = {},
  className,
  children,
  ariaLabel,
}: {
  href: string;
  event: string;
  parameters?: Record<string, unknown>;
  className: string;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={() => trackEvent(event, parameters)}
    >
      {children}
    </a>
  );
}
