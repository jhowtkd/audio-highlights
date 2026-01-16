import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AudioHighlights - Transcrição e Highlights com IA",
  description: "Ferramenta para transcrever podcasts e gerar highlights automaticamente usando IA da OpenAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
