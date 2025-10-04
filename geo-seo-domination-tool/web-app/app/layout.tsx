import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { SchedulerInit } from "@/components/SchedulerInit";
import { generateMetadata as generateSEOMetadata, generateStructuredData } from "@/lib/seo/metadata";
import { ClientTracker } from "./(analytics)/client-tracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = generateSEOMetadata({
  title: "Home",
  description: "Advanced local SEO and GEO ranking analysis tool. Track keywords, monitor rankings, analyze competitors, and dominate local search results.",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate structured data for SEO
  const organizationSchema = generateStructuredData('Organization');
  const websiteSchema = generateStructuredData('WebSite');
  const softwareSchema = generateStructuredData('SoftwareApplication');

  // Analytics tracking
  const release = process.env.NEXT_PUBLIC_RELEASE_TAG || '';
  const color = (process.env.NEXT_PUBLIC_TRAFFIC_COLOR as 'blue'|'green'|null) || null;

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen antialiased`}>
        <ErrorBoundary>
          <ClientTracker release={release} color={color} />
          <SchedulerInit />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
