// app/admin/page.tsx //
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

type Project = {
  id: string;
  name: string;
  type: string;
  target_minutes: number;
  is_active: boolean;
  created_at: string;
  admin_key: string;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("INDIVIDUAL");
  const [newTargetHours, setNewTargetHours] = useState(40);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const myPw = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const friendPw = process.env.NEXT_PUBLIC_FRIEND_PASSWORD;

    if (passwordInput === myPw || passwordInput === friendPw) {
      setAdminKey(passwordInput); // 입력한 비밀번호를 식별키로 사용
      setIsAuthenticated(true);
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminKey) {
      fetchProjects();
    }
  }, [isAuthenticated, adminKey]);

  const fetchProjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("prayer_projects")
      .select("*")
      .eq("admin_key", adminKey) // 💡 내 프로젝트만 필터링!
      .order("created_at", { ascending: false });

    if (error) {
      console.error("프로젝트 불러오기 에러:", error);
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return alert("프로젝트 이름을 입력해주세요.");

    setIsLoading(true);
    const targetMinutes = newTargetHours * 60;

    const { error } = await supabase.from("prayer_projects").insert([
      {
        name: newName,
        type: newType,
        target_minutes: targetMinutes,
        admin_key: adminKey,
      },
    ]);

    if (error) {
      console.error("프로젝트 생성 에러:", error);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
    } else {
      alert("새 프로젝트가 생성되었습니다!");
      setNewName("");
      setNewTargetHours(40);
      fetchProjects();
    }
    setIsLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-50 p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 flex flex-col gap-6 text-center"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">관리자 로그인</h1>
            <p className="text-sm text-gray-500 mt-1">
              부여받은 관리자 비밀번호를 입력해주세요.
            </p>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest text-gray-800 bg-white"
            placeholder="••••••••"
          />
          <button
            type="submit"
            className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            접속하기
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              기도의 잔 대시보드
            </h1>
            <p className="text-gray-500 mt-1">
              내 프로젝트를 생성하고 관리하세요.
            </p>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setAdminKey("");
            }}
            className="text-sm text-gray-400 hover:text-gray-600 font-medium"
          >
            로그아웃
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit space-y-6">
            <h2 className="text-xl font-bold text-gray-800">
              새 프로젝트 생성
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex) 2026-1 증인의 삶"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  진행 타입
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-gray-800"
                >
                  <option value="INDIVIDUAL">개별 잔 채우기 (명단 필요)</option>
                  <option value="COMMUNAL">공동체 전체 한 잔 채우기</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  목표 시간 (시간 단위)
                </label>
                <input
                  type="number"
                  value={newTargetHours}
                  onChange={(e) => setNewTargetHours(Number(e.target.value))}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition-colors disabled:opacity-50 mt-2"
              >
                {isLoading ? "생성 중..." : "+ 생성하기"}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center justify-between">
              프로젝트 목록
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                총 {projects.length}개
              </span>
            </h2>

            {isLoading && projects.length === 0 ? (
              <p className="text-gray-500">불러오는 중...</p>
            ) : projects.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-gray-200 border-dashed text-center text-gray-500">
                아직 생성된 프로젝트가 없습니다.
                <br />
                좌측에서 첫 프로젝트를 만들어보세요!
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-md ${project.type === "INDIVIDUAL" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}
                        >
                          {project.type === "INDIVIDUAL"
                            ? "개별형"
                            : "공동체형"}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-md ${project.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {project.is_active ? "진행중" : "종료됨"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 mb-1">
                        <h3 className="text-lg font-bold text-gray-800 leading-none">
                          {project.name}
                        </h3>
                        <a
                          href={`/${project.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          title="새 창으로 사용자 페이지 열기"
                        >
                          사용자 페이지 ↗
                        </a>
                      </div>
                      <p className="text-sm text-gray-500">
                        목표: {project.target_minutes / 60}시간
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        (window.location.href = `/admin/${project.id}`)
                      }
                      className="h-10 px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
                    >
                      {project.type === "INDIVIDUAL"
                        ? "명단 관리 / 통계 ➔"
                        : "통계 보기 ➔"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
