import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TaskQueueProvider } from "@/contexts/task-context";
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
  metadataBase: new URL("https://audio-highlights.netlify.app"),
  title: "AudioHighlights - Transcrição e Highlights com IA",
  description: "Ferramenta para transcrever podcasts e gerar highlights automaticamente usando IA da OpenAI. Transforme seus áudios em clips virais.",
  keywords: ["transcrição", "podcast", "highlights", "IA", "OpenAI", "Whisper", "GPT", "clips virais", "áudio"],
  authors: [{ name: "AudioHighlights" }],
  creator: "AudioHighlights",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://audio-highlights.netlify.app",
    siteName: "AudioHighlights",
    title: "AudioHighlights - Transcrição e Highlights com IA",
    description: "Transforme seus podcasts em clips virais com IA. Transcrição automática com Whisper e highlights inteligentes com GPT-4o.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AudioHighlights - Transcrição e Highlights com IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AudioHighlights - Transcrição e Highlights com IA",
    description: "Transforme seus podcasts em clips virais com IA. Transcrição automática e highlights inteligentes.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <TaskQueueProvider>
            {children}
          </TaskQueueProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
