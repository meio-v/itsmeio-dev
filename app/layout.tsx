import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITSMEIO.DEV",
  description: "it's meio the dev — gamedev · creative · tech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
