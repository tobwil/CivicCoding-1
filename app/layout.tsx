import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./alba.css";
import "./coach.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  const title = "ALBAthek Match – KITA-Personas im Test";
  const description =
    "ALBA-KITA-Teststand: Spiele ausschließlich aus der Content-Tabelle mit vier ausgearbeiteten Personas erproben.";

  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "de_DE",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1200,
          height: 630,
          alt: "ALBAthek Match – Bewegung, die zu euch passt.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
