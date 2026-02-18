import { Inter } from "next/font/google"; // 1. Impor font Inter
import "./globals.css"; // Pastikan CSS global tetap ada

// 2. Konfigurasi font
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 3. Gunakan inter.className dan suppressHydrationWarning */}
      <body
        className={`${inter.className} bg-[#FAFAFA] text-[#171717]`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
