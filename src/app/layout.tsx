import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'AgroRide - Tractor Booking Platform',
    template: '%s | AgroRide'
  },
  description: 'Connect with tractor owners for agricultural services. Book tractors, implement providers, and farming equipment across rural India.',
  keywords: ['tractor booking', 'agricultural services', 'farm equipment', 'tractor rental', 'farm mechanization'],
  authors: [{ name: 'AgroRide Team' }],
  creator: 'AgroRide',
  publisher: 'AgroRide',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'AgroRide',
    title: 'AgroRide - Tractor Booking Platform',
    description: 'Connect with tractor owners for agricultural services. Book tractors, implement providers, and farming equipment across rural India.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AgroRide - Tractor Booking Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgroRide - Tractor Booking Platform',
    description: 'Connect with tractor owners for agricultural services',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AgroRide" />

        {/* SEO meta tags */}
        <meta name="application-name" content="AgroRide" />
        <meta name="apple-mobile-web-app-title" content="AgroRide" />
        <meta name="description" content="Connect with tractor owners for agricultural services" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "AgroRide",
              "description": "Connect with tractor owners for agricultural services",
              "url": process.env.NEXTAUTH_URL,
              "applicationCategory": "Agriculture",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock"
              },
              "publisher": {
                "@type": "Organization",
                "name": "AgroRide"
              }
            })
          }}
        />
      </body>
    </html>
  );
}