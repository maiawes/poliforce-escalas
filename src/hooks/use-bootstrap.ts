"use client";

import { useEffect, useState } from "react";
import { ensureSeedData } from "@/lib/firebase/firestore";

export function useBootstrap() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;

    ensureSeedData()
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setBootstrapped(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return bootstrapped;
}
