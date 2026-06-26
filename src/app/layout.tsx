import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  title: "Coin Security | Malawi's Trusted Security Partner",
  description:
    "Professional security services in Malawi — man guarding, event security, rapid response, and off-site CCTV monitoring. Protecting businesses and communities since 2012.",
  keywords: [
    "security",
    "Malawi",
    "man guarding",
    "event security",
    "rapid response",
    "CCTV monitoring",
    "Lilongwe",
    "Blantyre",
    "security services Malawi",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Coin Security | Malawi's Trusted Security Partner",
    description:
      "Professional security services in Malawi — man guarding, event security, rapid response, and off-site CCTV monitoring.",
    type: "website",
    locale: "en_MW",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen flex flex-col bg-coin-dark text-coin-text font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
