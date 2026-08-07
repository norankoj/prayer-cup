import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
