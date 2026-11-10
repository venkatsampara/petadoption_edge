"use client";

import { useState } from "react";
import { PetImage } from "@/components/pet-image";

export function PetGallery({
  images,
  petName,
  petDescription,
}: {
  images: string[];
  petName: string;
  petDescription: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = Math.min(selectedIndex, images.length - 1);
  const selectedImage = images[activeIndex] ?? "/pet-placeholder.svg";

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-image-surface">
        <PetImage
          src={selectedImage}
          alt={`${petName}, an adoptable ${petDescription}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 56vw"
          className="object-cover object-[center_35%]"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-3 gap-3" role="group" aria-label={`${petName} photo gallery`}>
          {images.slice(0, 4).map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show photo ${index + 1} of ${Math.min(images.length, 4)} of ${petName}`}
              aria-pressed={activeIndex === index}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-image-surface focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <PetImage
                src={image}
                alt=""
                fill
                sizes="(max-width: 1024px) 32vw, 18vw"
                className="object-cover object-[center_35%]"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
