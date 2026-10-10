import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Email RAG App",
  description: "Chat with your emails",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <header className="border-b">
          <div className="container mx-auto flex h-14 items-center px-4 gap-6">
            <Link href="/" className="font-semibold text-lg hover:opacity-80 transition-opacity">
              Email RAG
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Chat</Link>
              <Link href="/ingest" className="hover:text-foreground transition-colors">Ingest Emails</Link>
            </nav>
          </div>
        </header>
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
