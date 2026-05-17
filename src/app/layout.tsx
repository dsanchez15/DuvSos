import type { Metadata } from "next";
import "./globals.css";
import ThemeHandler from "@/components/ThemeHandler";
import ThemeLoader from "@/components/ThemeLoader";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "Habit Tracker - Seguimiento de Hábitos",
  description: "Organiza tus hábitos y haz un seguimiento de tu progreso diario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-visual-theme="classic" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ThemeLoader>
          <ThemeHandler />
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeLoader>
      </body>
    </html>
  );
}
