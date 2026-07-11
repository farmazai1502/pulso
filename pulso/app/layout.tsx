import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulso",
  description: "Family health tracking for caretakers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
