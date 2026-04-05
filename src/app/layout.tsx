import type { Metadata } from 'next';
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Qr Share | Collectez vos souvenirs",
  description: "Partagez vos photos d'événements en un clin d'œil via QR Code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
