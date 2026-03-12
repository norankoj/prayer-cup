// app/[project_id]/[group_name]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Participant = {
  id: string;
  name: string;
};

export default function GroupMembersPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.project_id as string;
  const groupName = decodeURIComponent(params.group_name as string);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId && groupName) {
      fetchParticipants();
    }
  }, [projectId, groupName]);

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from("prayer_participants")
      .select("id, name")
      .eq("project_id", projectId)
      .eq("group_name", groupName)
      .order("name");

    if (error) {
      console.error("명단 불러오기 에러:", error);
    } else {
      setParticipants(data || []);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-neutral-50 flex items-center justify-center text-gray-500 font-medium">
        잠시만 기다려주세요...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-neutral-50 p-4 sm:p-6">
      {/* 커스텀 스크롤바 디자인 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* 💡 max-h-[85dvh]와 flex-col을 주어 모바일 화면을 넘지 않게 고정 */}
      <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-sm border border-neutral-100 flex flex-col overflow-hidden max-h-[85dvh]">
        {/* 상단 헤더 & 뒤로가기 (고정 영역) */}
        {/* shrink-0으로 압축 방지, z-10과 옅은 그림자로 입체감 추가 */}
        <div className="relative text-center p-6 sm:p-8 shrink-0 bg-white z-10 border-b border-gray-50 shadow-[0_4px_10px_-5px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => router.push(`/${projectId}`)}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-500 tracking-widest bg-blue-50 px-3 py-1 rounded-full inline-block">
              {groupName}
            </span>
            <h1 className="text-xl font-bold text-gray-800 pt-2">
              이름을 선택해주세요
            </h1>
          </div>
        </div>

        {/* 이름 목록 바둑판 (스크롤 영역) */}
        {/* flex-1과 overflow-y-auto를 주어 이 부분만 스크롤되도록 설정 */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-neutral-50/30">
          {participants.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-xl text-gray-500 text-sm border border-gray-100 border-dashed">
              등록된 명단이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    router.push(
                      `/${projectId}/${encodeURIComponent(groupName)}/${p.id}`,
                    )
                  }
                  className="h-14 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center text-lg"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
