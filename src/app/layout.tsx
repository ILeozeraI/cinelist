import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: { default: `${APP_NAME}: o que assistir nos streamings`, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body className="flex min-h-screen flex-col bg-zinc-950 font-sans text-zinc-100 antialiased">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
