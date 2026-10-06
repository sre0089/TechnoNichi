import type { Metadata } from 'next';
import '@fontsource/kalam/latin-400.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daily Book',
  description:
    'A quiet place for your day. An independent digital book planner.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
