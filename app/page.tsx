"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import TopBar from "./components/TopBar";
import AgentList from "./components/AgentList";
import Sidebar from "./components/Sidebar";
import Timeline from "./components/Timeline";
import { useHackathonStore } from "@/lib/store";

const PhaserGame = dynamic(() => import("./components/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-950 text-gray-500">
      Loading game engine...
    </div>
  ),
});

export default function Home() {
  const goToRound = useHackathonStore((s) => s.goToRound);

  useEffect(() => { goToRound(1); }, [goToRound]);

  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-3/5 relative">
          <PhaserGame />
        </div>
        <Sidebar />
      </div>
      <AgentList />
      <Timeline />
    </div>
  );
}
