import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QuizStatsProvider } from "@/contexts/QuizStatsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kati Sajilo",
  description: "Master Nepal Engineering Council exam with smart MCQ practice",
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
          <QuizStatsProvider>
            <Header />
            {children}
            <Footer />
          </QuizStatsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

