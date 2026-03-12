// app/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-neutral-50 p-6 text-center space-y-6">
      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.5a7.5 7.5 0 01-7.5-7.5c0-4.14 5.3-10.3 6.64-11.75a1.15 1.15 0 011.72 0C14.2 3.7 19.5 9.86 19.5 14a7.5 7.5 0 01-7.5 7.5z" />
        </svg>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-neutral-800 tracking-tight">
          기도의 잔
        </h1>
        <p className="text-neutral-500 mt-2 font-medium break-keep">
          전달받으신 프로젝트 전용 링크(URL)를 통해 접속해주세요.
        </p>
      </div>

      <button
        onClick={() => router.push("/admin")}
        className="px-6 py-3 bg-neutral-800 text-white rounded-xl font-bold hover:bg-neutral-900 transition-colors shadow-md"
      >
        관리자 페이지로 이동
      </button>
    </div>
  );
}
