import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { getStoreSettings, getVisibleCategories } from "@/lib/queries";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aircarecrew.shop";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AirCareCrew.shop — Gear for the Crew",
    template: "%s | AirCareCrew.shop",
  },
  description:
    "Independently operated crew merchandise for air medical and HEMS crewmembers. Shirts and hats built for the job.",
  openGraph: {
    type: "website",
    siteName: "AirCareCrew.shop",
    title: "AirCareCrew.shop — Gear for the Crew",
    description:
      "Independently operated crew merchandise for air medical and HEMS crewmembers. Shirts and hats built for the job.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AirCareCrew.shop — Gear for the Crew",
    description: "Crew merchandise for air medical and HEMS crewmembers.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=ac1", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/favicon-16x16.png?v=ac1", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=ac1", sizes: "32x32", type: "image/png" },
      { url: "/icon.png?v=ac1", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=ac1", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#111318",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getStoreSettings(), getVisibleCategories()]);

  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-body">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <CartProvider>
          {settings?.maintenance_mode ? (
            <MaintenanceScreen storeName={settings.store_name} />
          ) : (
            <>
              <SiteHeader categories={categories} settings={settings} />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <SiteFooter categories={categories} settings={settings} />
              <CartDrawer />
            </>
          )}
        </CartProvider>
      </body>
    </html>
  );
}

function MaintenanceScreen({ storeName }: { storeName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-graphite-950 px-6 text-center text-offwhite">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{storeName}</h1>
      <p className="mt-3 max-w-md text-graphite-600">
        We&apos;re making some updates and will be back shortly. Thanks for your patience.
      </p>
    </div>
  );
}
