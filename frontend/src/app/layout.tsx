import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VivaAI – AI Video Explanation Evaluator",
  description:
    "Upload your video explanation and get instant AI-powered feedback on how well it matches the reference answer.",
  keywords: ["AI", "video evaluation", "speech to text", "similarity score", "education"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
