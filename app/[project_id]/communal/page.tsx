// app/[project_id]/communal/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import confetti from "canvas-confetti";

const TIME_OPTIONS = [
  { label: "10 분", value: 10 },
  { label: "15 분", value: 15 },
  { label: "30 분", value: 30 },
  { label: "1 시간", value: 60 },
  { label: "1시간 30 분", value: 90 },
  { label: "2 시간", value: 120 },
  { label: "2시간 30 분", value: 150 },
  { label: "3 시간", value: 180 },
];

export default function CommunalPrayerCup() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;

  const [projectName, setProjectName] = useState("");
  const [targetMinutes, setTargetMinutes] = useState(2400);
  const [isLoading, setIsLoading] = useState(true);

  const [minutes, setMinutes] = useState(0);
  const [selectedValue, setSelectedValue] = useState(10);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPouring, setIsPouring] = useState(false);
  const [animType, setAnimType] = useState("single-drop");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const percentage = Math.min((minutes / targetMinutes) * 100, 100);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (projectId) fetchCommunalData();
  }, [projectId]);

  const fetchCommunalData = async () => {
    // 1. 프로젝트 정보 불러오기
    const { data: projData, error: projError } = await supabase
      .from("prayer_projects")
      .select("name, target_minutes, type")
      .eq("id", projectId)
      .single();

    if (projError || !projData) {
      alert("프로젝트 정보를 찾을 수 없습니다.");
      return router.push("/");
    }

    setProjectName(projData.name);
    setTargetMinutes(projData.target_minutes);

    // 2. 공동체 전체의 누적 시간 계산하기 (prayer_logs 테이블에서 해당 프로젝트의 모든 시간을 더함)
    const { data: logsData } = await supabase
      .from("prayer_logs")
      .select("added_minutes")
      .eq("project_id", projectId);

    if (logsData) {
      const total = logsData.reduce((sum, log) => sum + log.added_minutes, 0);
      setMinutes(total);
    }

    setIsLoading(false);
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
  };

  const handlePour = async () => {
    if (isProcessingRef.current || isModalOpen || minutes >= targetMinutes)
      return;

    isProcessingRef.current = true;
    setIsDropdownOpen(false);
    setIsPouring(true);

    let currentAnimType = "single-drop";
    let fillDelay = 400;
    let totalDuration = 700;

    if (selectedValue >= 180) {
      currentAnimType = "stream";
      fillDelay = 500;
      totalDuration = 1000;
    } else if (selectedValue >= 120) {
      currentAnimType = "many-drops";
      fillDelay = 600;
      totalDuration = 1500;
    } else if (selectedValue >= 90) {
      currentAnimType = "triple-drop";
      fillDelay = 500;
      totalDuration = 1100;
    } else if (selectedValue >= 60) {
      currentAnimType = "double-drop";
      fillDelay = 400;
      totalDuration = 900;
    } else {
      currentAnimType = "single-drop";
      fillDelay = 400;
      totalDuration = 700;
    }

    setAnimType(currentAnimType);
    const nextMinutes = Math.min(minutes + selectedValue, targetMinutes);

    setTimeout(() => {
      setMinutes(nextMinutes);
    }, fillDelay);

    // 💡 DB에 실제 데이터 저장 (participant_id는 null로 저장됩니다)
    await supabase.from("prayer_logs").insert([
      {
        project_id: projectId,
        participant_id: null,
        added_minutes: selectedValue,
      },
    ]);

    setTimeout(() => {
      setIsPouring(false);
      isProcessingRef.current = false;

      if (nextMinutes >= targetMinutes && minutes < targetMinutes) {
        setModalMessage(
          `할렐루야! 우리 공동체가 기도의 잔 ${formatTime(targetMinutes)}을 모두 채웠습니다! 🎉`,
        );
        setIsModalOpen(true);

        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 100,
        };
        const randomInRange = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          const colors = ["#54a2ff", "#93c5fd", "#ffffff", "#fcd34d"];

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors,
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors,
          });
        }, 250);
      } else {
        setModalMessage(
          `공동체 기도의 잔 ${formatTime(selectedValue)}이 채워졌습니다.`,
        );
        setIsModalOpen(true);
      }
    }, totalDuration);
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "정말로 공동체의 잔을 초기화하시겠습니까? 기록이 모두 사라집니다.",
      )
    ) {
      setMinutes(0);
      // 프로젝트의 모든 로그 기록을 삭제하여 누적 시간을 0으로 만듦
      await supabase.from("prayer_logs").delete().eq("project_id", projectId);
      alert("초기화가 완료되었습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-neutral-50 flex items-center justify-center text-gray-500 font-medium">
        잔을 가져오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-neutral-50 p-4 sm:p-6 relative overflow-hidden">
      {/* 팝업(모달) UI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs text-center space-y-4 animate-in fade-in zoom-in duration-200">
            {minutes >= targetMinutes ? (
              <div className="w-12 h-12 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
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
                    d="M5 3v4M19 3v4M5 11h14M5 11c0 3.866 3.134 7 7 7s7-3.134 7-7M5 11a4 4 0 01-4-4V5h4m14 6a4 4 0 004-4V5h-4M12 18v3m-3 0h6"
                  ></path>
                </svg>
              </div>
            ) : (
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            )}

            <h3 className="text-lg font-bold text-neutral-800">
              {minutes >= targetMinutes ? "목표 달성!" : "채우기 완료"}
            </h3>
            <p className="text-neutral-600 font-medium pb-2 break-keep">
              {modalMessage}
            </p>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes drop { 0% { top: -15%; opacity: 0; transform: scale(0.8); } 20% { top: 10%; opacity: 1; transform: scaleY(1.2) scaleX(0.9); } 70% { top: 75%; opacity: 1; transform: scaleY(1.1) scaleX(0.95); } 100% { top: 95%; opacity: 0; transform: scaleY(0.5) scaleX(1.5); } }
        @keyframes multi-drop { 0% { top: -10%; opacity: 0; transform: scale(0.7); } 15% { top: 5%; opacity: 1; transform: scaleY(1.2) scaleX(0.8); } 85% { top: 85%; opacity: 1; transform: scaleY(1.1) scaleX(0.9); } 100% { top: 95%; opacity: 0; transform: scaleY(0.4) scaleX(1.3); } }
        @keyframes stream { 0% { top: -20%; height: 0%; opacity: 0.8; } 30% { top: -10%; height: 110%; opacity: 1; } 70% { top: -10%; height: 110%; opacity: 1; } 100% { top: 100%; height: 0%; opacity: 0; } }
        .animate-drop { animation: drop 0.7s ease-in forwards; } .animate-drop-delay-1 { animation: drop 0.7s ease-in 0.15s forwards; opacity: 0; } .animate-drop-delay-2 { animation: drop 0.7s ease-in 0.3s forwards; opacity: 0; }
        .animate-multi-drop { animation: multi-drop 0.8s ease-in forwards; opacity: 0; } .animate-stream { animation: stream 1s ease-in-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-sm border border-neutral-100 p-6 flex flex-col gap-6">
        {/* 헤더 */}
        <div className="flex justify-between items-start relative">
          <div className="space-y-1">
            <span className="text-xs font-bold text-purple-500 tracking-widest bg-purple-50 px-3 py-1 rounded-full inline-block mb-1">
              공동체 기도의 잔
            </span>
            <h1 className="text-2xl font-bold text-neutral-800 tracking-tight break-keep">
              {projectName}
            </h1>
            <p className="text-sm text-neutral-500 font-medium mt-1">
              목표: {formatTime(targetMinutes)} ({formatTime(minutes)} /{" "}
              {formatTime(targetMinutes)})
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-neutral-400 hover:text-red-500 transition-colors px-2 py-1 bg-neutral-50 hover:bg-red-50 rounded-md mt-1"
          >
            초기화
          </button>
        </div>

        {/* 잔 (Cup) UI */}
        <div className="relative w-48 h-64 mx-auto border-4 border-neutral-200 rounded-b-[2.5rem] rounded-t-lg overflow-hidden bg-neutral-50/50 shadow-inner">
          {isPouring && (
            <div className="absolute left-0 top-0 w-full h-full z-10 pointer-events-none overflow-hidden">
              {animType === "single-drop" && (
                <svg
                  viewBox="0 0 100 120"
                  fill="#54a2ff"
                  className="absolute left-1/2 -translate-x-1/2 w-10 h-14 animate-drop"
                >
                  <path d="M50,10 Q80,50 80,70 A30,30 0 0,1 20,70 Q20,50 50,10 Z" />
                </svg>
              )}
              {animType === "double-drop" && (
                <div className="relative flex justify-center w-full h-full">
                  <svg
                    viewBox="0 0 100 120"
                    fill="#54a2ff"
                    className="absolute w-10 h-14 animate-drop -translate-x-5"
                  >
                    <path d="M50,10 Q80,50 80,70 A30,30 0 0,1 20,70 Q20,50 50,10 Z" />
                  </svg>
                  <svg
                    viewBox="0 0 100 120"
                    fill="#54a2ff"
                    className="absolute w-8 h-12 animate-drop-delay-1 translate-x-5"
                  >
                    <path d="M50,10 Q80,50 80,70 A30,30 0 0,1 20,70 Q20,50 50,10 Z" />
                  </svg>
                </div>
              )}
              {animType === "triple-drop" && (
                <div className="relative flex justify-center w-full h-full">
                  <svg
                    viewBox="0 0 100 120"
                    fill="#54a2ff"
                    className="absolute w-8 h-12 animate-drop -translate-x-8"
                  >
                    <path d="M50,10 Q80,50 80,70 A30,30 0 0,1 20,70 Q20,50 50,10 Z" />
                  </svg>
                  <svg
                    viewBox="0 0 100 120"
                    fill="#54a2ff"
                    className="absolute w-10 h-14 animate-drop-delay-1"
                  >
                    <path d="M50,10 Q80,50 80,70 A30,30 0 0,1 20,70 Q20,50 50,10 Z" />
                  </svg>
                  <svg
                    viewBox="0 0 100 120"
                    fill="#54a2ff"
                    className="absolute w-8 h-12 animate-drop-delay-2 translate-x-8"
                  >
                    <path d="M50,10 Q80,50 80,70 A30,30 0 0,1 20,70 Q20,50 50,10 Z" />
                  </svg>
                </div>
              )}
              {animType === "many-drops" && (
                <div className="relative w-full h-full">
                  {[...Array(7)].map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 100 120"
                      fill="#54a2ff"
                      className="absolute animate-multi-drop"
                      style={{
                        left: `${10 + i * 12}%`,
                        width: `${24 + (i % 3) * 6}px`,
                        height: `${32 + (i % 3) * 8}px`,
                        animationDelay: `${(i % 4) * 0.15 + (i % 2) * 0.1}s`,
                      }}
                    >
                      <path d="M50,10 Q80,50 80,70 A30,30 0 0,1 20,70 Q20,50 50,10 Z" />
                    </svg>
                  ))}
                </div>
              )}
              {animType === "stream" && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-2.5 h-full animate-stream rounded-full blur-[1px]"
                  style={{ backgroundColor: "#54a2ff" }}
                ></div>
              )}
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 w-full bg-blue-400 transition-all duration-1000 ease-in-out z-0"
            style={{ height: `${percentage}%` }}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-300 opacity-60"></div>
          </div>
        </div>

        <div className="text-center text-4xl font-extrabold text-blue-500 tracking-tighter">
          {percentage.toFixed(1)}
          <span className="text-2xl text-blue-400">%</span>
        </div>

        {/* 컨트롤 영역 */}
        <div className="relative flex gap-3 mt-2">
          <div className="relative w-3/5">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isModalOpen}
              className="w-full h-12 px-4 text-left bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex justify-between items-center shadow-sm disabled:opacity-50"
            >
              <span className="text-neutral-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis text-base">
                {TIME_OPTIONS.find((opt) => opt.value === selectedValue)?.label}
              </span>
              <svg
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-blue-400 rounded-lg shadow-lg z-50 overflow-hidden">
                <ul className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                  {TIME_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedValue(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-base transition-colors ${selectedValue === option.value ? "bg-blue-600 text-white font-bold" : "text-neutral-700 hover:bg-blue-100"}`}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={handlePour}
            disabled={isPouring || isModalOpen}
            className="flex-1 h-12 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 text-sm sm:text-base disabled:cursor-not-allowed"
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
                strokeWidth="2.5"
                d="M12 3v13m0 0l-4-4m4 4l4-4"
              ></path>
            </svg>
            채우기
          </button>
        </div>
      </div>
    </div>
  );
}
