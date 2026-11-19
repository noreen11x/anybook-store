import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toast } from "@/components/AppChrome";

export const metadata: Metadata = {
  title: { default: "AnyBook — New & secondhand books, Cairo", template: "%s · AnyBook" },
  description: "New releases at publisher price and hand-graded secondhand copies for less — delivered anywhere in Egypt.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f3f2f2" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
        />
      </head>
      <body>
        {children}
        <Toast />
      </body>
    </html>
  );
}
