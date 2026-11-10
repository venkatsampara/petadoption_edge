"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { getPetImageUrl } from "@/lib/pet-image-url";

type PetImageProps = Omit<ImageProps, "src"> & { src: string };

export function PetImage({ src, alt, ...props }: PetImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = getPetImageUrl(src);
  const displaySrc = failedSrc === src ? "/pet-placeholder.svg" : image.src;

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  return (
    <Image
      {...props}
      src={displaySrc}
      alt={failedSrc === src ? "" : alt}
      unoptimized={!image.optimized && failedSrc !== src}
      onError={() => setFailedSrc(src)}
    />
  );
}
