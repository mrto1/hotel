import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Direktbuchung", robots: { index: true } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: Browser-Erweiterungen (z. B. Dark Reader) ändern Attribute an <html>/<body>
    <html lang="de" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
