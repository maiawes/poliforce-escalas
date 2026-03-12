"use client";

import { useEffect, useState } from "react";
import { ShiftBlock, ShiftWithBlocks } from "@/types";
import {
  subscribeToMonthlyShiftBlocks,
  subscribeToMonthlyShifts,
} from "@/lib/firebase/firestore";
import { attachBlocks } from "@/lib/shifts/aggregation";

export function useMonthlyData(monthKey: string) {
  const [shiftsState, setShiftsState] = useState<{
    monthKey: string;
    items: Omit<ShiftWithBlocks, "blocks">[];
  }>({
    monthKey: "",
    items: [],
  });
  const [blocksState, setBlocksState] = useState<{
    monthKey: string;
    items: ShiftBlock[];
  }>({
    monthKey: "",
    items: [],
  });

  useEffect(() => {
    const unsubscribeShifts = subscribeToMonthlyShifts(monthKey, (items) => {
      setShiftsState({
        monthKey,
        items,
      });
    });

    const unsubscribeBlocks = subscribeToMonthlyShiftBlocks(monthKey, (items) => {
      setBlocksState({
        monthKey,
        items,
      });
    });

    return () => {
      unsubscribeShifts();
      unsubscribeBlocks();
    };
  }, [monthKey]);

  return {
    shifts: attachBlocks(shiftsState.items, blocksState.items),
    loading: shiftsState.monthKey !== monthKey || blocksState.monthKey !== monthKey,
  };
}
