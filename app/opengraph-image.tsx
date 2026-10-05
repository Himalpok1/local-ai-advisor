import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { HARDWARE, MODELS } from "@/data";

export const alt = "Local AI Advisor: will local AI actually run well on your computer?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site-wide share card; routes without their own opengraph-image use this one. */
export default async function Image() {
  const logo = await readFile(path.join(process.cwd(), "public", "brand", "logo-mark-128.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", padding: 56, background: "#FDF8E7" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 48,
          background: "#FFFFFF",
          border: "6px solid #171410",
          borderRadius: 32,
          boxShadow: "14px 14px 0 #171410",
          color: "#171410",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={logoSrc} width={64} height={64} alt="" />
          <div style={{ display: "flex", fontSize: 32, fontWeight: 800 }}>Local AI Advisor</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 70, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>Will local AI actually run well on your computer?</div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", padding: "8px 22px", background: "#FFCF1F", border: "4px solid #171410", borderRadius: 999, fontSize: 28, fontWeight: 800 }}>
              {`Free check · ${MODELS.length} models · ${HARDWARE.length} computers · no sign-up`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 28, fontWeight: 800 }}>iownchatgpt.com</div>
      </div>
    </div>,
    size,
  );
}
