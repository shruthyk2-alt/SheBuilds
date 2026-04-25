import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'SafeTap — One Tap. Total Safety.',
  description: 'SafeTap gives you instant SOS, legal guidance, safe phrase triggers, and emergency contact dispatch — all from one tap.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
</body>
    </html>
  );
}