import type { Metadata } from "next";
import { ThemeProvider } from "./_components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "it's meio the dev",
  description: "it's meio the dev — gamedev · creative · tech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
