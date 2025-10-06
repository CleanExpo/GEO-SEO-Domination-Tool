import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { SchedulerInit } from "@/components/SchedulerInit";
import { CommandPaletteProvider } from "@/components/command-palette-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { generateMetadata as generateSEOMetadata, generateStructuredData } from "@/lib/seo/metadata";

const inter = Inter({ subsets: ["latin"] });

// Force dynamic rendering globally to prevent build-time database access
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

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
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ErrorBoundary>
            <SchedulerInit />
            <CommandPaletteProvider>
              <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
                <Sidebar />
                <main className="flex-1 lg:ml-0 pt-16 lg:pt-0">
                  {children}
                </main>
              </div>
              <Toaster />
            </CommandPaletteProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
