"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page rendering failed:", error);
  }, [error]);

  return (
    <div className="page-shell py-24 text-center">
      <p className="eyebrow">A small hiccup</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">We couldn&apos;t load these pets right now.</h1>
      <p className="mx-auto mt-4 max-w-xl text-muted">Please try again in a moment. Our pet listings are temporarily unavailable.</p>
      <button className="button mt-7" onClick={reset}>Try again</button>
    </div>
  );
}
