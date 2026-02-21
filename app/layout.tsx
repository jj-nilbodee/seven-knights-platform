import type { Metadata } from "next";
import { Noto_Sans_Thai, Chakra_Petch } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Seven Knights Re:Birth — Guild Platform",
  description: "ระบบจัดการกิลด์ Seven Knights Re:Birth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${notoSansThai.variable} ${chakraPetch.variable} font-sans antialiased`}
      >
        {children}
        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
