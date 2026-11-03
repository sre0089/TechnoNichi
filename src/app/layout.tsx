import type { Metadata } from 'next';
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
};

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
