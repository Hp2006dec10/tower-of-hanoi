import type { Metadata } from "next";
import { Geist, Geist_Mono, Bungee } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Tower of Hanoi",
  description: "Play the Tower of Hanoi challenge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable} antialiased cursor-default`}
      >
        <div className="min-h-[100dvh] text-slate-100">
          <main className="w-full flex h-full min-h-[100dvh] flex-col items-center justify-center px-4 background-gradient">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
