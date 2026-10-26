import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tcocalc - Vehicle Total Cost of Ownership Calculator",
  description: "Calculate and compare total cost of ownership for gas, hybrid, and electric vehicles across their entire lifecycle.",
};

const themeInitScript = `(function() {
  try {
    var saved = localStorage.getItem('tcocalc_theme');
    var isDark = saved === 'dark' || ((!saved || saved === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
