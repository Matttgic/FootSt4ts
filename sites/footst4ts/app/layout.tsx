import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FootSt4ts — Football & analyses",
  description: "Matchs, statistiques et estimations football traçables.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
