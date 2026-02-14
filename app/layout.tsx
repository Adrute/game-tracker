import type { Metadata, Viewport } from "next";
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
  title: "My Games Tracker",
  description: "Gestor de colección de videojuegos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyGames",
    // startupImage: [] // Opcional: Podrías añadir imágenes de carga aquí en el futuro
  },
};

export const viewport: Viewport = {
  themeColor: "#111827", // Coincide con el bg-gray-900 de tu app
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita el zoom al escribir en inputs en iOS
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        {children}
      </body>
    </html>
  );
}