import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import '@fontsource/kalam/latin-400.css';
import './globals.css';

const interfaceFont = localFont({
  src: '../../node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2',
  variable: '--font-ui-face',
  weight: '100 700',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});
const displayFont = localFont({
  src: '../../node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2',
  variable: '--font-serif-face',
  weight: '400 700',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
});

export const metadata: Metadata = {
  title: 'Daily Book',
  description:
    'A quiet place for your day. An independent digital book planner.',
  applicationName: 'Daily Book',
  appleWebApp: {
    capable: true,
    title: 'Daily Book',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/book.svg', type: 'image/svg+xml' },
      { url: '/icons/book-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        type: 'image/png',
        sizes: '180x180',
      },
    ],
  },
};

export const viewport: Viewport = { themeColor: '#514560' };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${interfaceFont.variable} ${displayFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
