import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlow = Barlow({
  weight: '700',
  subsets: ["latin"],
  variable: "--font-barlow",
}); 

export const metadata: Metadata = {
  title: "AvailCoupon",
  description: "Manage coupons and discounts with Firebase backend",
  icons: {
    icon: [
      {
        url: '/Favicon 1.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/Favicon 1.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    apple: '/Favicon 1.svg',
    shortcut: '/Favicon 1.svg',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
