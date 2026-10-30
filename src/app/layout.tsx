import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { site } from "@/content/site";
import "./globals.scss";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  authors: [{ name: site.fullName, url: site.contact.linkedin }],
};

export const viewport: Viewport = {
  themeColor: "#222124",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={interTight.variable}>
      <body data-preloading="true">{children}</body>
    </html>
  );
}
