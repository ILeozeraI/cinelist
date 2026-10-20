import type { Metadata } from "next";
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/site";
import "./globals.css";

// Letreiro de cinema para títulos; o eixo "opsz" deixa a letra mais fina e alta nos tamanhos grandes.
const display = Big_Shoulders({ subsets: ["latin"], variable: "--font-display-face", axes: ["opsz"] });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: `${APP_NAME}: o que assistir nos streamings`, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col bg-sala font-sans text-tela antialiased">
        <Header />
        <main className="w-full flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
