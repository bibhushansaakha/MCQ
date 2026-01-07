import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QuizStatsProvider } from "@/contexts/QuizStatsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Favicon from "@/components/Favicon";

export const metadata: Metadata = {
  title: "Kati Sajilo",
  description: "Master Nepal Engineering Council exam with smart MCQ practice",
  icons: {
    icon: "/favicons/light.png", // Default favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <Favicon />
          <QuizStatsProvider>
            <Header />
            {children}
            <Footer />
          </QuizStatsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
