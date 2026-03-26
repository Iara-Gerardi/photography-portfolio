import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iara Gerardi | Photography Portfolio",
  description:
    "Photography portfolio of Iara Gerardi — exploring street, fashion, and portrait photography.",
  authors: [{ name: "Iara Gerardi" }],
  keywords: ["photography", "portfolio", "street photography", "fashion photography", "portrait photography", "Iara Gerardi"],
  openGraph: {
    type: "website",
    title: "Iara Gerardi | Photography Portfolio",
    description:
      "Photography portfolio of Iara Gerardi — exploring street, fashion, and portrait photography.",
    siteName: "Iara Gerardi Photography",
  },
  twitter: {
    card: "summary_large_image",
    title: "Iara Gerardi | Photography Portfolio",
    description:
      "Photography portfolio of Iara Gerardi — exploring street, fashion, and portrait photography.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
