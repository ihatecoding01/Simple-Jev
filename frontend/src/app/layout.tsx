import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Jev — Conversational Interface for TypeSafe AI",
  description: "A no-code conversational layer between plain English and TypeSafe AI's Jev model. Translate thoughts into deterministic, validated decisions without seeing raw JSON.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F4F4F1] text-[#111111]">{children}</body>
    </html>
  );
}
