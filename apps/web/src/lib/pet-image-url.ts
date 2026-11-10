const cloudinaryHost = "res.cloudinary.com";

export function getPetImageUrl(src: string): { src: string; optimized: boolean } {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return { src, optimized: true };
  }

  if (url.protocol !== "https:" || url.hostname !== cloudinaryHost || !url.pathname.includes("/image/upload/")) {
    return { src, optimized: false };
  }

  const uploadPath = "/image/upload/";
  const uploadIndex = url.pathname.indexOf(uploadPath) + uploadPath.length;
  const nextSegment = url.pathname.slice(uploadIndex).split("/")[0];
  if (!nextSegment.includes("f_auto") || !nextSegment.includes("q_auto")) {
    url.pathname = `${url.pathname.slice(0, uploadIndex)}f_auto,q_auto/${url.pathname.slice(uploadIndex)}`;
  }

  return { src: url.toString(), optimized: true };
}
