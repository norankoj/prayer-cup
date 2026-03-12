// app/admin/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Project = {
  id: string;
  name: string;
  type: string;
  target_minutes: number;
  is_active: boolean; // 상태값 추가
};

type Participant = {
  id: string;
  group_name: string;
  name: string;
  total_minutes: number;
};

type SortField = keyof Participant;
type SortDirection = "asc" | "desc";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [groupSelect, setGroupSelect] = useState("오전반");
  const [customGroupName, setCustomGroupName] = useState("");
  const [namesText, setNamesText] = useState("");
  const [isInserting, setIsInserting] = useState(false);

  const [sortField, setSortField] = useState<SortField>("group_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    if (projectId) {
      fetchProjectDetail();
      fetchParticipants();
    }
  }, [projectId]);

  const fetchProjectDetail = async () => {
    const { data, error } = await supabase
      .from("prayer_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("프로젝트 조회 에러:", error);
      alert("프로젝트를 찾을 수 없습니다.");
      router.push("/admin");
    } else {
      setProject(data);
    }
  };

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from("prayer_participants")
      .select("*")
      .eq("project_id", projectId);

    if (!error && data) {
      setParticipants(data);
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async () => {
    if (!project) return;

    const newStatus = !project.is_active;
    const confirmMessage = newStatus
      ? "프로젝트를 다시 [진행중] 상태로 변경하시겠습니까?"
      : "프로젝트를 [종료] 하시겠습니까? (종료해도 명단과 시간은 유지됩니다)";

    if (!window.confirm(confirmMessage)) return;

    const { error } = await supabase
      .from("prayer_projects")
      .update({ is_active: newStatus })
      .eq("id", project.id);

    if (error) {
      console.error("상태 변경 에러:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    } else {
      setProject({ ...project, is_active: newStatus });
    }
  };

  const handleBulkInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namesText.trim()) return alert("추가할 이름들을 입력해주세요.");

    const finalGroupName =
      groupSelect === "기타" ? customGroupName.trim() : groupSelect;
    if (!finalGroupName) return alert("그룹명을 입력해주세요.");

    setIsInserting(true);

    const nameList = namesText
      .split(/[\n,]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (nameList.length === 0) {
      setIsInserting(false);
      return alert("유효한 이름이 없습니다.");
    }

    const insertData = nameList.map((name) => ({
      project_id: projectId,
      group_name: finalGroupName,
      name: name,
    }));

    const { error } = await supabase
      .from("prayer_participants")
      .insert(insertData);

    if (error) {
      console.error("명단 추가 에러:", error);
      alert("명단 추가 중 오류가 발생했습니다.");
    } else {
      alert(`${nameList.length}명의 명단이 성공적으로 추가되었습니다!`);
      setNamesText("");
      setCustomGroupName("");
      fetchParticipants();
    }

    setIsInserting(false);
  };

  const handleDeleteParticipant = async (id: string, name: string) => {
    if (
      !window.confirm(
        `${name}님을 명단에서 삭제하시겠습니까? (기록된 시간도 함께 삭제됩니다)`,
      )
    )
      return;

    const { error } = await supabase
      .from("prayer_participants")
      .delete()
      .eq("id", id);
    if (!error) {
      fetchParticipants();
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <span className="text-gray-300 ml-1">↕</span>;
    return sortDirection === "asc" ? (
      <span className="text-blue-500 ml-1">▲</span>
    ) : (
      <span className="text-blue-500 ml-1">▼</span>
    );
  };

  if (isLoading || !project) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center text-gray-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
          <button
            onClick={() => router.push("/admin")}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                {project.type === "INDIVIDUAL" ? "개별형" : "공동체형"}
              </span>
              <button
                onClick={handleToggleStatus}
                title="클릭하여 상태 변경하기"
                className={`text-xs font-bold px-2 py-1 rounded-md transition-colors border ${
                  project.is_active
                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {project.is_active
                  ? "진행중 (클릭시 종료)"
                  : "종료됨 (클릭시 진행)"}
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {project.name}
            </h1>
          </div>
        </div>

        {project.type === "INDIVIDUAL" ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit space-y-6">
              <h2 className="text-xl font-bold text-gray-800">
                명단 일괄 추가
              </h2>
              <form onSubmit={handleBulkInsert} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    그룹명 선택
                  </label>
                  <select
                    value={groupSelect}
                    onChange={(e) => setGroupSelect(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 bg-white"
                  >
                    <option value="오전반">오전반</option>
                    <option value="오후반">오후반</option>
                    <option value="기타">기타 (직접 입력)</option>
                  </select>

                  {groupSelect === "기타" && (
                    <input
                      type="text"
                      value={customGroupName}
                      onChange={(e) => setCustomGroupName(e.target.value)}
                      placeholder="새로운 그룹명 입력"
                      className="mt-2 w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 bg-white"
                      autoFocus
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex justify-between">
                    이름 목록
                    <span className="text-xs font-normal text-gray-400">
                      엔터로 구분
                    </span>
                  </label>
                  <textarea
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                    placeholder="노나연&#10;홍길동&#10;김철수"
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 bg-white resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isInserting}
                  className="w-full h-11 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
                >
                  {isInserting
                    ? "추가 중..."
                    : `${namesText.split(/[\n,]+/).filter((n) => n.trim()).length}명 추가하기`}
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center justify-between">
                등록된 명단
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                  총 {participants.length}명
                </span>
              </h2>

              {participants.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-gray-200 border-dashed text-center text-gray-500">
                  아직 등록된 명단이 없습니다.
                  <br />
                  좌측에서 엑셀 복붙으로 명단을 추가해보세요!
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 select-none">
                      <tr>
                        <th
                          className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                          onClick={() => handleSort("group_name")}
                        >
                          그룹 {renderSortIcon("group_name")}
                        </th>
                        <th
                          className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                          onClick={() => handleSort("name")}
                        >
                          이름 {renderSortIcon("name")}
                        </th>
                        <th
                          className="px-4 py-3 font-semibold text-right cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                          onClick={() => handleSort("total_minutes")}
                        >
                          누적 시간 {renderSortIcon("total_minutes")}
                        </th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedParticipants.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold">
                              {p.group_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800">
                            {p.name}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">
                            {Math.floor(p.total_minutes / 60)}시간{" "}
                            {p.total_minutes % 60}분
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() =>
                                handleDeleteParticipant(p.id, p.name)
                              }
                              className="text-gray-400 hover:text-red-500 font-medium text-xs transition-colors"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center space-y-2">
            <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              공동체형 프로젝트입니다
            </h2>
            <p className="text-gray-500">
              이 프로젝트는 개별 명단이 필요하지 않습니다. 누구나 참여하여
              하나의 거대한 잔을 채웁니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
