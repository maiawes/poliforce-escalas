"use client";

import { useEffect, useState } from "react";
import { Settings } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/shifts/constants";
import { subscribeToSettings } from "@/lib/firebase/firestore";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((nextSettings) => {
      setSettings(nextSettings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}
