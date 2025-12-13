import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow, Pacifico, Dancing_Script } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";

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

const dancingScript = Dancing_Script({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

export const metadata: Metadata = {
  title: "MimeCode",
  description: "Manage coupons and discounts with Firebase backend",
  // icons: {
  //   icon: [
  //     {
  //       url: '/Group 1171275295.svg',
  //       type: 'image/svg+xml',
  //     },
  //     {
  //       url: '/Group 1171275295.svg',
  //       sizes: 'any',
  //       type: 'image/svg+xml',
  //     },
  //   ],
  //   apple: '/Group 1171275295.svg',
  //   shortcut: '/Group 1171275295.svg',
  // },
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
      <head>
        <meta name="linkbuxverifycode" content="32dc01246faccb7f5b3cad5016dd5033" />
        <meta name="verify-admitad" content="ed8e6fa9c3" />
        {/* Resource hints for faster connections */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} ${pacifico.variable} ${dancingScript.variable} antialiased`}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
