"use client";

import { useEffect, useState } from "react";
import { ShiftWithBlocks } from "@/types";
import {
  subscribeToShiftBlocksByShiftId,
  subscribeToShiftById,
} from "@/lib/firebase/firestore";

export function useShift(shiftId: string) {
  const [shift, setShift] = useState<Omit<ShiftWithBlocks, "blocks"> | null>(null);
  const [blocks, setBlocks] = useState<ShiftWithBlocks["blocks"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeShift = subscribeToShiftById(shiftId, (item) => {
      setShift(item);
      setLoading(false);
    });

    const unsubscribeBlocks = subscribeToShiftBlocksByShiftId(shiftId, (items) => {
      setBlocks(items);
      setLoading(false);
    });

    return () => {
      unsubscribeShift();
      unsubscribeBlocks();
    };
  }, [shiftId]);

  return {
    shift: shift ? { ...shift, blocks } : null,
    loading,
  };
}
