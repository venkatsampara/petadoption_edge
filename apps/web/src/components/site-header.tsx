import Link from "next/link";
import { PawPrint } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-forest/10 bg-canvas/95 backdrop-blur">
      <div className="page-shell flex h-[76px] items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber"
          aria-label="Hyderabad Paws home"
        >
          <span className="grid size-10 place-items-center rounded-full bg-forest text-canvas">
            <PawPrint size={21} aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">Hyderabad Paws</span>
        </Link>
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-3 sm:gap-8">
            <li>
              <Link className="nav-link" href="/adopt">Find a pet</Link>
            </li>
            <li className="hidden sm:list-item">
              <Link className="nav-link" href="/about">Our story</Link>
            </li>
            <li>
              <Link className="button button-small" href="/adopt">Meet your match</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
