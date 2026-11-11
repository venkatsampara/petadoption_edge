import type { Metadata } from "next";
import Link from "next/link";
import { PetSubmissionForm } from "@/components/pet-submission-form";

export const metadata: Metadata = {
  title: "Post a Pet",
  description: "Share a pet for adoption with the Hyderabad Paws team.",
  robots: { index: false, follow: false },
};

export default function PostAPetPage() {
  return (
    <div className="public-theme page-shell pb-16 pt-12 sm:pt-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-2">
          <li><Link href="/">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-forest">Post a pet</li>
        </ol>
      </nav>
      <div className="mx-auto mt-9 grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Help a pet find a home</p>
          <h1 className="fluid-title mt-3 font-serif font-semibold text-forest">Share their story.</h1>
          <p className="mt-5 leading-7 text-muted">
            Tell us about a pet looking for a home. You do not need an account to submit.
            Our admin team will review the details and may contact you manually before publication.
          </p>
          <p className="mt-5 leading-7 text-muted">
            Photos are optional. If you have Cloudinary image links, you can share them below;
            they will be reviewed before publication.
          </p>
          <p className="mt-7 text-sm leading-6 text-muted">
            Already a caretaker?{" "}
            <Link href="/caretaker" className="font-bold text-forest underline underline-offset-4">
              Go to the caretaker dashboard
            </Link>.
          </p>
        </div>
        <PetSubmissionForm />
      </div>
    </div>
  );
}
