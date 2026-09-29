import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale } from '@/src/lib/locale';
import './globals.css';

export const metadata: Metadata = {
  applicationName: 'Sahakar Bharati',
  title: {
    default: 'Sahakar Bharati — सहकार मिठाई',
    template: '%s · Sahakar Bharati',
  },
  description:
    'सहकार भारती मिठाई एडवांस प्री-बुकिंग एवं बिक्री केंद्र प्रबंधन प्लेटफ़ॉर्म — Sweet advance pre-booking & sale-center management platform.',
  openGraph: {
    title: 'Sahakar Bharati — सहकार मिठाई',
    description:
      'सहकार भारती मिठाई एडवांस प्री-बुकिंग एवं बिक्री केंद्र प्रबंधन प्लेटफ़ॉर्म',
    siteName: 'Sahakar Bharati',
    type: 'website',
  },
};

/**
 * Mobile viewport. Without this Next.js does not emit a viewport meta tag, so
 * phones render at a ~980px virtual width and zoom out — undermining every
 * responsive utility class in the app. `maximum-scale` is intentionally left
 * unset so users can still pinch-zoom (accessibility).
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The active locale is forwarded by the Edge middleware as `x-locale`, so the
  // document language attribute always matches the URL locale (/en -> "en",
  // /hi -> "hi"). Falls back to the default when the header is absent.
  const headerLocale = (await headers()).get('x-locale');
  const lang = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600;700&family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-amber-50/30 text-slate-900 font-sans antialiased selection:bg-amber-200 selection:text-amber-950">
        {children}
      </body>
    </html>
  );
}
