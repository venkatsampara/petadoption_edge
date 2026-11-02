import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell py-24 text-center">
      <span className="text-5xl" aria-hidden="true">🐾</span>
      <h1 className="mt-5 font-serif text-4xl text-forest">Looks like this pet has found a home.</h1>
      <p className="mx-auto mt-4 max-w-lg text-muted">Or perhaps that page wandered off. There are more lovely pets to meet.</p>
      <Link className="button mt-7" href="/adopt">Browse adoptable pets</Link>
    </div>
  );
}
