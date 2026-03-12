// app/[project_id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Project = {
  id: string;
  name: string;
  type: string;
  is_active: boolean; // 💡 상태값 추가
};

export default function ProjectEntryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(true); // 💡 종료 여부 상태

  useEffect(() => {
    if (projectId) {
      const savedUrl = localStorage.getItem("my_prayer_cup_url");
      if (savedUrl && savedUrl.includes(projectId)) {
        router.replace(savedUrl);
        return;
      }
      fetchProjectAndGroups();
    }
  }, [projectId, router]);

  const fetchProjectAndGroups = async () => {
    const { data: projectData, error: projectError } = await supabase
      .from("prayer_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !projectData) {
      alert("존재하지 않거나 삭제된 프로젝트입니다.");
      return router.push("/");
    }

    setProject(projectData);
    setIsActive(projectData.is_active);

    // 프로젝트가 종료되었다면 그룹 명단을 안 불러오고 여기서 멈춤
    if (!projectData.is_active) {
      setIsLoading(false);
      return;
    }

    if (projectData.type === "COMMUNAL") {
      router.push(`/${projectId}/communal`);
      return;
    }

    const { data: participantsData } = await supabase
      .from("prayer_participants")
      .select("group_name")
      .eq("project_id", projectId);

    if (participantsData) {
      const uniqueGroups = Array.from(
        new Set(participantsData.map((p) => p.group_name)),
      );
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

  // 종료된 프로젝트일 때 보여줄 화면
  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-neutral-50 p-4 sm:p-6 text-center">
        <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-sm border border-neutral-100 p-8 space-y-4">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            종료된 프로젝트입니다
          </h1>
          <p className="text-gray-500 text-sm break-keep">
            이 기도의 잔 프로젝트는 마감되었습니다.
            <br />
            그동안 참여해주셔서 감사합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-neutral-50 p-4 sm:p-6">
      <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-sm border border-neutral-100 p-8 space-y-8 text-center">
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
        {groups.length === 0 ? (
          <div className="p-6 bg-gray-50 rounded-xl text-gray-500 text-sm border border-gray-100 border-dashed">
            아직 등록된 명단이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3">
            {groups.map((group) => (
              <button
                key={group}
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
