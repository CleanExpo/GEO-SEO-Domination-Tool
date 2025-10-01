import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO-SEO Domination Tool",
  description: "Advanced local SEO and GEO ranking analysis tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
