// app/[project_id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Project = {
  id: string;
  name: string;
  type: string;
};

export default function ProjectEntryPage() {
  const params = useParams();
  const router = useRouter();
  // 폴더명을 [project_id]로 만들었으므로 params.project_id를 사용합니다.
  const projectId = params.project_id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectAndGroups();
    }
  }, [projectId]);

  const fetchProjectAndGroups = async () => {
    // 1. 프로젝트 정보 가져오기
    const { data: projectData, error: projectError } = await supabase
      .from("prayer_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !projectData) {
      alert("존재하지 않거나 삭제된 프로젝트입니다.");
      return router.push("/"); // 에러 시 메인으로
    }

    setProject(projectData);

    // 2. 만약 "공군 성전재건 기도회" 같은 공동체형(COMMUNAL)이라면?
    // 그룹을 고를 필요 없이 바로 공동체 잔 페이지로 튕겨버립니다!
    if (projectData.type === "COMMUNAL") {
      router.push(`/${projectId}/communal`);
      return;
    }

    // 3. "증인의 삶" 같은 개별형(INDIVIDUAL)이라면 명단에서 그룹만 뽑아오기
    const { data: participantsData } = await supabase
      .from("prayer_participants")
      .select("group_name")
      .eq("project_id", projectId);

    if (participantsData) {
      // 중복을 제거하여 ['오전반', '오후반', '기타'] 등 고유한 그룹명만 추출합니다.
      const uniqueGroups = Array.from(
        new Set(participantsData.map((p) => p.group_name)),
      );
      // 보기 좋게 가나다순으로 정렬
      uniqueGroups.sort();
      setGroups(uniqueGroups);
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

  // 개별형 프로젝트의 그룹 선택 화면 (모바일 뷰 최적화)
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-neutral-50 p-4 sm:p-6">
      <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-sm border border-neutral-100 p-8 space-y-8 text-center">
        {/* 타이틀 영역 */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-blue-500 tracking-widest bg-blue-50 px-3 py-1 rounded-full">
            PRAYER CUP
          </span>
          <h1 className="text-2xl font-bold text-gray-800 break-keep pt-2">
            {project?.name}
          </h1>
          <p className="text-sm text-gray-500">
            본인이 속한 그룹을 선택해주세요.
          </p>
        </div>

        {/* 그룹 선택 버튼들 */}
        {groups.length === 0 ? (
          <div className="p-6 bg-gray-50 rounded-xl text-gray-500 text-sm border border-gray-100 border-dashed">
            아직 등록된 명단이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3">
            {groups.map((group) => (
              <button
                key={group}
                // 그룹명에 띄어쓰기나 특수문자가 있을 수 있으므로 encodeURIComponent로 감싸서 넘깁니다.
                onClick={() =>
                  router.push(`/${projectId}/${encodeURIComponent(group)}`)
                }
                className="w-full h-14 bg-white border-2 border-gray-100 rounded-xl font-bold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-between px-6 shadow-sm hover:shadow-md"
              >
                <span className="text-lg">{group}</span>
                <svg
                  className="w-5 h-5 opacity-40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
