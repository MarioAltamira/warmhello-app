import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt =
  "Warm-Hello - Gentle daily SMS check-ins for seniors living alone. Caregiver peace of mind, senior dignity first.";

const DEFAULT_TITLE = "Warm-Hello";
const DEFAULT_SUBTITLE =
  "Gentle daily SMS check-ins for seniors living alone.";
const DEFAULT_PRICE = "From $5 USD / month · $0.16 / day";

function splitTitle(input: string, maxChars: number): string[] {
  if (!input) return [DEFAULT_TITLE, DEFAULT_SUBTITLE];
  if (input.length <= maxChars) return [input];
  const words = input.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  if (lines.length === 0) lines.push(DEFAULT_TITLE);
  if (lines.length === 1) lines.push(DEFAULT_SUBTITLE);
  return lines.slice(0, 3);
}

type Props = {
  params?: Record<string, unknown>;
  searchParams?: {
    title?: string;
    text?: string;
    subtitle?: string;
    tag?: string;
  };
};

export default async function Image(props: Props) {
  const q = props.searchParams ?? {};
  const rawTitle = q.title ?? q.text ?? "";
  const subtitle = q.subtitle ?? DEFAULT_SUBTITLE;
  const tag = q.tag ?? "Caregiver peace of mind · Dignity for seniors";

  let title: string;
  let subtitleLine: string;
  if (!rawTitle.trim()) {
    title = DEFAULT_TITLE;
    subtitleLine = DEFAULT_PRICE;
  } else {
    title = rawTitle.trim();
    subtitleLine = subtitle;
  }

  const titleLines = splitTitle(title, 36);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0b1220 0%, #1b2549 45%, #2a4289 80%, #3a69c7 100%)",
          color: "#f8fafc",
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "88px 96px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: 0.98,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background:
                "radial-gradient(circle at 30% 20%, #ffffff 0%, #fef3c7 40%, #f59e0b 100%)",
              boxShadow:
                "0 18px 50px -12px rgba(245, 158, 11, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800,
              color: "#7c2d12",
              letterSpacing: "-0.02em",
            }}
          >
            W
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Warm-Hello
            </div>
            <div
              style={{
                fontSize: 17,
                color: "rgba(226,232,240,0.72)",
                letterSpacing: "0.02em",
                fontWeight: 500,
              }}
            >
              warm-hello.com
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 1020,
          }}
        >
          {titleLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                fontSize: idx === 0 ? 76 : 60,
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                textShadow: "0 4px 30px rgba(0,0,0,0.25)",
              }}
            >
              {line}
            </div>
          ))}

          <div
            style={{
              fontSize: 30,
              lineHeight: 1.3,
              color: "rgba(226,232,240,0.88)",
              fontWeight: 500,
              maxWidth: 920,
            }}
          >
            {subtitleLine}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              fontSize: 20,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            <span style={{ fontSize: 22 }}>✉️</span>
            <span>SMS check-in · 1 tap reply</span>
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(226,232,240,0.78)",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            {tag}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
