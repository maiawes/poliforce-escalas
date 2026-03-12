"use client";

import { useEffect, useState } from "react";
import { Agent } from "@/types";
import { subscribeToAgents } from "@/lib/firebase/firestore";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAgents((items) => {
      setAgents(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    agents,
    activeAgents: agents.filter((agent) => agent.active),
    loading,
  };
}
