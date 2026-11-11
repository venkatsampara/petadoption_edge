import Link from "next/link";
import { PawPrint } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-forest-strong py-12 text-white">
      <div className="page-shell grid gap-8 sm:grid-cols-2 sm:items-end">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold">
            <PawPrint aria-hidden="true" size={20} />
            Hyderabad Paws
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
            Good people, good pets, and a more loving Hyderabad — one adoption at a time.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="sm:justify-self-end">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/85">
            <li><Link className="footer-link" href="/adopt">Adopt</Link></li>
            <li><Link className="footer-link" href="/dogs-for-adoption">Dogs</Link></li>
            <li><Link className="footer-link" href="/cats-for-adoption">Cats</Link></li>
            <li><Link className="footer-link" href="/pet-adoption-guide">Pet adoption guide</Link></li>
            <li><Link className="footer-link" href="/about">About</Link></li>
            <li><Link className="footer-link" href="/volunteer">Volunteer</Link></li>
          </ul>
        </nav>
        <p className="border-t border-white/20 pt-5 text-xs text-white/65 sm:col-span-2">
          Made with care for Hyderabad&apos;s pets and people.
        </p>
      </div>
    </footer>
  );
}
