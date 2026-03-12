import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
