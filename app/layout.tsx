import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "기도의 잔",
  description: "기도를 모아 기도의 잔을 채워주세요.",
  manifest: "/manifest.json",
  icons: {
    icon: "/thumbnail.png",
    apple: "/thumbnail.png",
  },

  openGraph: {
    title: "기도의 잔",
    description: "기도를 모아 기도의 잔을 채워주세요.",
    siteName: "기도의 잔",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/thumbnail.png",
        width: 800,
        height: 400,
        alt: "나의 기도의 잔 썸네일",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "기도의 잔",
    statusBarStyle: "default",
    startupImage: "/thumbnail.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 앱처럼 화면 확대 방지
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
