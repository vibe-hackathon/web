"use client";

import { useEffect, useRef, useCallback } from "react";
import { useHackathonStore } from "@/lib/store";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<any>(null);
  const agents = useHackathonStore((s) => s.agents);
  const selectAgent = useHackathonStore((s) => s.selectAgent);
  const selectedAgentId = useHackathonStore((s) => s.selectedAgentId);

  const handleClick = useCallback((id: string) => selectAgent(id), [selectAgent]);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;
    async function init() {
      const bridge = await import("@/game/PhaserBridge");
      if (!mounted || !containerRef.current) return;
      bridgeRef.current = bridge;
      bridge.initGame(containerRef.current, useHackathonStore.getState().agents, handleClick);
    }
    init();
    return () => { mounted = false; bridgeRef.current?.destroyGame(); };
  }, [handleClick]);

  useEffect(() => { bridgeRef.current?.updateGameAgents(agents); }, [agents]);
  useEffect(() => { bridgeRef.current?.focusGameAgent(selectedAgentId); }, [selectedAgentId]);

  return <div ref={containerRef} id="game-container" className="w-full h-full" style={{ minHeight: 600 }} />;
}
