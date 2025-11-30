import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow, Pacifico } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";

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

const pacifico = Pacifico({
  weight: '400',
  subsets: ["latin"],
  variable: "--font-pacifico",
}); 

export const metadata: Metadata = {
  title: "MimeCode",
  description: "Manage coupons and discounts with Firebase backend",
  icons: {
    icon: [
      {
        url: '/Group 1171275295.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/Group 1171275295.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    apple: '/Group 1171275295.svg',
    shortcut: '/Group 1171275295.svg',
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
        className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} ${pacifico.variable} antialiased`}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
