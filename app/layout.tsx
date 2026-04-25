import type { Metadata } from 'next';
import { Cinzel, Crimson_Text, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Layout from '@/components/Layout';
import SentryClientInit from '@/components/SentryClientInit';

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-display' });
const crimson = Crimson_Text({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-body',
});
const jetbrains = JetBrains_Mono({
  weight: ['500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
});

const defaultOrigin =
  process.env.NEXT_PUBLIC_SITE_URL != null && process.env.NEXT_PUBLIC_SITE_URL !== ''
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultOrigin),
  title: 'Grim Dudes — WFRP 4e Stat Blocks',
  description: 'Warhammer Fantasy Roleplay 4th Edition stat block editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${crimson.variable} ${jetbrains.variable}`}
    >
      <body>
        <SentryClientInit />
        <Layout>{children}</Layout>
        <Analytics />
      </body>
    </html>
  );
}
