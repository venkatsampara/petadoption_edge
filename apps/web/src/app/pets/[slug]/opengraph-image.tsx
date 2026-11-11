import { ImageResponse } from "next/og";
import { ApiRequestError, getPet } from "@/lib/api";

export const alt = "Adoptable Hyderabad Paws pet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function OpenGraphImage({ params }: { params: { slug: string } }) {
  let name = "A new best friend is waiting";
  let area = "Hyderabad";
  let image: string | null = null;
  try {
    const pet = await getPet(params.slug);
    name = pet.name;
    area = pet.area;
    image = pet.images[0] ?? null;
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 404) throw error;
  }

  const response = new ImageResponse(
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 64,
      color: "#1F4E3D",
      background: "#FDFBF7",
      fontFamily: "sans-serif",
    }}>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 650 }}>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#B97519" }}>HYDERABAD PAWS</div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#6B6B6B" }}>{area}, Hyderabad</div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 22 }}>A little more love starts right here.</div>
      </div>
      {image
        ? <img src={image} width="360" height="360" style={{ objectFit: "cover", borderRadius: 28 }} />
        : <div style={{ display: "flex", width: 360, height: 360, borderRadius: 180, background: "#E9F0EA", alignItems: "center", justifyContent: "center", fontSize: 126 }}>🐾</div>}
    </div>,
    size,
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
