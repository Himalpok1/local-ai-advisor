import { hfOgImage } from "@/lib/hf/og";
export const alt = "Local AI Advisor — estimated comfort on M4 Pro 48GB";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 21600;
export default async function Image({ params }: { params: Promise<{ owner: string; model: string }> }) {
  const { owner, model } = await params;
  return hfOgImage(`${owner}/${model}`);
}
