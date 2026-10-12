import type { Metadata } from "next";
import {Tajawal} from "next/font/google";
import "./globals.css";

const font = Tajawal({
    subsets:['latin'],
    weight:['400','500','700','900']
  })

export const metadata: Metadata = {
  title: "Quiosco Next.js con App route y Prisma",
  description: "Quiosco Next.js con App route y Prisma",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.className} bg-gre-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
