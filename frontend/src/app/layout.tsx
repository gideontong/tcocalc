import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tcocalc - Vehicle Total Cost of Ownership Calculator",
  description: "Calculate and compare total cost of ownership for gas, hybrid, and electric vehicles across their entire lifecycle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
