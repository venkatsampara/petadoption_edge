import Link from "next/link";
import { PawPrint } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-forest/10 bg-canvas/95 backdrop-blur">
      <div className="page-shell flex min-h-[76px] flex-wrap items-center justify-between gap-y-1 py-2 sm:flex-nowrap sm:py-0">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber"
          aria-label="Hyderabad Paws home"
        >
          <span className="grid size-10 place-items-center rounded-full bg-forest text-canvas">
            <PawPrint size={21} aria-hidden="true" />
          </span>
          <span className="text-base font-extrabold tracking-tight sm:text-lg">Hyderabad Paws</span>
        </Link>
        <nav aria-label="Main navigation" className="w-full sm:w-auto">
          <ul className="flex items-center justify-between gap-2 sm:justify-end sm:gap-4 lg:gap-6">
            <li>
              <Link className="nav-link whitespace-nowrap" href="/post-a-pet">Post a pet</Link>
            </li>
            <li className="hidden sm:list-item">
              <Link className="nav-link" href="/adopt">Find a pet</Link>
            </li>
            <li className="hidden sm:list-item">
              <Link className="nav-link" href="/about">Our story</Link>
            </li>
            <li className="hidden lg:list-item">
              <Link className="nav-link" href="/dogs-for-adoption">Dogs</Link>
            </li>
            <li className="hidden lg:list-item">
              <Link className="nav-link" href="/cats-for-adoption">Cats</Link>
            </li>
            <li className="hidden md:list-item">
              <Link className="nav-link" href="/pet-adoption-guide">Guides</Link>
            </li>
            <li>
              <ThemeToggle />
            </li>
            <li>
              <Link className="button button-small" href="/adopt">
                <span className="sm:hidden">Find a pet</span>
                <span className="hidden sm:inline">Meet your match</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
